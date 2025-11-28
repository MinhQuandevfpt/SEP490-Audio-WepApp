import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Trash2, Store, Sparkles, MessageCircle, MessageSquare, Image, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIChatService from '../../services/ai/AIChatService';
import ChatService, { type CustomerConversation } from '../../services/customer/ChatService';
import { useChatContext } from '../../contexts/ChatContext';
import { CustomerAuthService } from '../../services/customer/Authcustomer';
import { CustomerStoreService } from '../../services/customer/StoreService';
import FirebaseRealtimeChatService from '../../services/FirebaseRealtimeChatService';
import FileUploadService from '../../services/FileUploadService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  mediaUrl?: string | Array<{ url: string; type?: string }>;
}

type ChatMode = 'ai' | 'store' | 'list';

interface ConversationWithStoreInfo extends CustomerConversation {
  storeName: string;
  storeAvatar?: string;
}

const AIChatbot: React.FC = () => {
  const navigate = useNavigate();
  const chatContext = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('ai');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string; type: 'image' | 'video' }>>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationWithStoreInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedStore, setSelectedStore] = useState<ConversationWithStoreInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = CustomerAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    
    checkAuth();
    // Check auth when chat opens
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  // Listen to context changes
  useEffect(() => {
    console.log('🔍 Context changed:', {
      contextIsOpen: chatContext.isOpen,
      isOpen,
      chatMode: chatContext.chatMode,
      storeId: chatContext.storeId,
      isAuthenticated
    });
    
    if (chatContext.isOpen && !isOpen) {
      setIsOpen(true);
      
      // If opening chat with a specific store, switch to list mode
      if (chatContext.chatMode === 'store' && chatContext.storeId) {
        console.log('✅ Opening chat with store:', chatContext.storeId);
        setChatMode('list');
        setStoreId(chatContext.storeId);
        // Load conversations will happen in next effect
      } else {
        setChatMode(chatContext.chatMode);
        if (chatContext.storeId) {
          setStoreId(chatContext.storeId);
        }
      }
    }
  }, [chatContext.isOpen, chatContext.chatMode, chatContext.storeId, isAuthenticated]);

  // Load conversations when switching to list mode
  useEffect(() => {
    console.log('📝 Load conversations effect:', {
      isOpen,
      chatMode,
      isAuthenticated,
      storeId
    });
    
    if (isOpen && chatMode === 'list' && isAuthenticated) {
      console.log('✅ Calling loadConversationsAndSelectStore...');
      loadConversationsAndSelectStore();
    }
  }, [isOpen, chatMode, isAuthenticated, storeId]);

  // Get or generate userId
  const getUserId = () => {
    let userId = localStorage.getItem('aiChatUserId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('aiChatUserId', userId);
    }
    return userId;
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Load store messages when switching to store mode
  useEffect(() => {
    if (isOpen && chatMode === 'store' && storeId) {
      loadStoreMessages();
    }
  }, [isOpen, chatMode, storeId]);

  // Get store ID from URL or context (for store chat)
  useEffect(() => {
    // First check context
    if (chatContext.storeId) {
      setStoreId(chatContext.storeId);
      return;
    }
    
    // Try to get store ID from URL path (e.g., /store/{storeId} or /product/{id})
    const pathParts = window.location.pathname.split('/');
    const storeIndex = pathParts.indexOf('store');
    if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
      const id = pathParts[storeIndex + 1];
      setStoreId(id);
      chatContext.setStoreId(id);
    }
  }, [window.location.pathname]);

  // Load messages and setup Firebase listener for store chat
  useEffect(() => {
    // Only skip if in AI mode, allow both 'store' and 'list' modes
    if (!isOpen || chatMode === 'ai' || !selectedStore?.storeId) {
      return;
    }

    const customerId = ChatService.getCurrentUserId();
    if (!customerId) {
      return;
    }

    // Clear old messages first
    setMessages([]);
    setIsLoading(true);

    // First, load messages from API (has full mediaUrl array info)
    const loadInitialMessages = async () => {
      try {
        const response = await ChatService.getMessages(customerId, selectedStore.storeId, 100);
        
        if (response.data && response.data.length > 0) {
          const loadedMessages: Message[] = response.data.map((msg) => ({
            id: msg.id || Date.now().toString(),
            role: msg.senderType === 'CUSTOMER' ? 'user' : 'assistant',
            content: msg.content || '',
            messageType: (msg.messageType || 'TEXT') as 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED',
            mediaUrl: msg.mediaUrl, // Preserve array format from API
            timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()),
          }));
          setMessages(loadedMessages);
          setIsLoading(false);
        } else {
          setMessages([{
            id: '0',
            role: 'assistant',
            content: 'Xin chào! Cửa hàng có thể giúp gì cho bạn?',
            timestamp: new Date(),
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading initial messages:', error);
        setIsLoading(false);
      }
    };

    loadInitialMessages();

    // Subscribe to Firebase realtime updates
    // Firebase now supports full mediaUrl array, so we can use it directly
    const unsubscribe = FirebaseRealtimeChatService.subscribeToMessages(
      customerId,
      selectedStore.storeId,
      (firebaseMessages) => {
        setIsLoading(false);
        
        if (firebaseMessages.length === 0) {
          // No messages in Firebase
          setMessages([{
            id: '0',
            role: 'assistant',
            content: 'Xin chào! Cửa hàng có thể giúp gì cho bạn?',
            timestamp: new Date(),
          }]);
        } else {
          // Convert Firebase messages to Message format
          // Firebase now supports both string and array format for mediaUrl
          const formattedMessages: Message[] = firebaseMessages.map((msg): Message => {
            const role: 'user' | 'assistant' = msg.senderType === 'CUSTOMER' ? 'user' : 'assistant';
            const formatted: Message = {
              id: msg.id,
              role: role,
              content: msg.content || '',
              messageType: (msg.messageType || 'TEXT') as 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED',
              mediaUrl: msg.mediaUrl, // Can be string or array - preserve as is
              timestamp: new Date(msg.createdAt),
            };
            
            // Debug log for media messages
            if (formatted.messageType === 'IMAGE' || formatted.messageType === 'MIXED' || formatted.mediaUrl) {
              console.log('📸 Media message received from Firebase:', {
                id: formatted.id,
                messageType: formatted.messageType,
                mediaUrlType: Array.isArray(formatted.mediaUrl) ? 'array' : typeof formatted.mediaUrl,
                mediaUrlLength: Array.isArray(formatted.mediaUrl) ? formatted.mediaUrl.length : 1,
                mediaUrl: formatted.mediaUrl
              });
            }
            
            return formatted;
          });
          setMessages(formattedMessages);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, chatMode, selectedStore?.storeId]);

  const loadStoreMessages = async () => {
    if (!storeId) return;
    
    const customerId = ChatService.getCurrentUserId();
    if (!customerId) {
      setMessages([{
        id: '0',
        role: 'assistant',
        content: 'Vui lòng đăng nhập để chat với cửa hàng.',
        timestamp: new Date(),
      }]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await ChatService.getMessages(customerId, storeId, 50);
      
      const loadedMessages: Message[] = response.data.map((msg) => ({
        id: msg.id || Date.now().toString(),
        role: msg.senderType === 'CUSTOMER' ? 'user' : 'assistant',
        content: msg.content,
        messageType: (msg.messageType || 'TEXT') as 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED',
        mediaUrl: msg.mediaUrl,
        timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()),
      }));

      if (loadedMessages.length === 0) {
        setMessages([{
          id: '0',
          role: 'assistant',
          content: 'Xin chào! Cửa hàng có thể giúp gì cho bạn?',
          timestamp: new Date(),
        }]);
      } else {
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading store messages:', error);
      setMessages([{
        id: '0',
        role: 'assistant',
        content: 'Xin chào! Cửa hàng có thể giúp gì cho bạn?',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    const customerId = ChatService.getCurrentUserId();
    if (!customerId) return;

    try {
      setIsLoading(true);
      const convList = await ChatService.getCustomerConversations(customerId);
      
      // Fetch store info (name + avatar)
      const conversationsWithStoreInfo = await Promise.all(
        convList.map(async (conv) => {
          try {
            const storeDetail = await CustomerStoreService.getStoreById(conv.storeId);
            return {
              ...conv,
              storeName: storeDetail.storeName || `Shop ${conv.storeId.substring(0, 8)}`,
              storeAvatar: storeDetail.logoUrl || CustomerStoreService.getDefaultAvatar(storeDetail.storeName),
            };
          } catch (error) {
            console.error(`Failed to fetch store ${conv.storeId}:`, error);
            return {
              ...conv,
              storeName: `Shop ${conv.storeId.substring(0, 8)}`,
              storeAvatar: CustomerStoreService.getDefaultAvatar(`Shop ${conv.storeId.substring(0, 8)}`),
            };
          }
        })
      );

      setConversations(conversationsWithStoreInfo);
      return conversationsWithStoreInfo;
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationsAndSelectStore = async () => {
    console.log('🚀 loadConversationsAndSelectStore started, storeId:', storeId);
    const convList = await loadConversations();
    console.log('📦 Loaded conversations:', convList?.length, convList);
    
    // If we have a storeId from context
    if (storeId) {
      // Try to find existing conversation
      const targetConv = convList?.find(conv => conv.storeId === storeId);
      console.log('🎯 Target conversation:', targetConv);
      
      if (targetConv) {
        // Found existing conversation, select it
        console.log('✅ Found existing conversation, selecting it');
        setSelectedStore(targetConv);
      } else {
        // No existing conversation (either convList is empty or store not in list)
        // Create a new one by fetching store info
        console.log('⚠️ No existing conversation, creating new one');
        try {
          const storeDetail = await CustomerStoreService.getStoreById(storeId);
          const newConv: ConversationWithStoreInfo = {
            id: `${ChatService.getCurrentUserId()}_${storeId}`,
            storeId: storeId,
            customerId: ChatService.getCurrentUserId() || '',
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            storeName: storeDetail.storeName || `Shop ${storeId.substring(0, 8)}`,
            storeAvatar: storeDetail.logoUrl || CustomerStoreService.getDefaultAvatar(storeDetail.storeName),
          };
          console.log('✨ Created new conversation:', newConv);
          setSelectedStore(newConv);
          // Add to conversations list
          setConversations(prev => [newConv, ...prev]);
        } catch (error) {
          console.error('❌ Error creating new conversation:', error);
        }
      }
    } else {
      console.log('⚠️ No storeId');
    }
  };

  const switchChatMode = (mode: ChatMode) => {
    setChatMode(mode);
    chatContext.openChat(mode === 'store' ? mode : 'ai', storeId || undefined);
    
    if (mode === 'ai') {
      setMessages([{
        id: '0',
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date(),
      }]);
    } else if (mode === 'store') {
      if (storeId) {
        loadStoreMessages();
      } else {
        setMessages([{
          id: '0',
          role: 'assistant',
          content: 'Vui lòng chọn một cửa hàng để bắt đầu chat.',
          timestamp: new Date(),
        }]);
      }
    } else if (mode === 'list') {
      loadConversations();
    }
  };

  const handleSelectConversation = (conv: ConversationWithStoreInfo) => {
    setStoreId(conv.storeId);
    setSelectedStore(conv);
    // Firebase listener in useEffect will handle loading messages
  };

  const handleSendMessage = async () => {
    // Check if there's text or files to send
    const hasText = inputMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if (!hasText && !hasFiles) return;

    const messageToSend = inputMessage.trim();
    const filesToSend = [...selectedFiles];

    // Clear inputs immediately
    setInputMessage('');
    setSelectedFiles([]);

    try {
      if (chatMode === 'ai') {
        // AI Chat doesn't support media
        if (hasFiles) {
          alert('Chỉ có thể gửi ảnh/video khi chat với cửa hàng');
          return;
        }

        setIsLoading(true);
        
        // Add user message immediately for AI chat
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: messageToSend,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        
        // AI Chat
        const response = await AIChatService.sendMessage({
          userId: getUserId(),
          message: messageToSend,
          userName: 'Guest',
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      } else {
        // Store Chat
        const customerId = ChatService.getCurrentUserId();
        if (!customerId) {
          throw new Error('Vui lòng đăng nhập để chat với cửa hàng.');
        }
        
        const targetStoreId = storeId || selectedStore?.storeId;
        if (!targetStoreId) {
          throw new Error('Không tìm thấy thông tin cửa hàng.');
        }

        let mediaUrl: string | Array<{ url: string; type: string }> | undefined;
        let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED' = 'TEXT';
        let content = messageToSend;

        // Upload files if exists
        if (filesToSend.length > 0) {
          setIsUploading(true);
          
          try {
            const uploadedMedia: Array<{ url: string; type: string }> = [];
            
            // Upload all files
            for (const fileItem of filesToSend) {
              let uploadedUrl: string;
              if (fileItem.type === 'image') {
                const uploadResponse = await FileUploadService.uploadImage(fileItem.file);
                uploadedUrl = uploadResponse.url;
              } else {
                const uploadResponse = await FileUploadService.uploadVideo(fileItem.file);
                uploadedUrl = uploadResponse.url;
              }
              
              uploadedMedia.push({
                url: uploadedUrl,
                type: fileItem.type
              });
            }

          // Determine message type
          if (filesToSend.length === 1 && !content.trim()) {
            // Single file without text - use IMAGE/VIDEO
            messageType = filesToSend[0].type === 'image' ? 'IMAGE' : 'VIDEO';
            mediaUrl = uploadedMedia[0].url; // Keep old format for backward compatibility
            content = ''; // Empty content when only media is sent
          } else {
            // Multiple files or has text - use MIXED
            messageType = 'MIXED';
            mediaUrl = uploadedMedia;
            // Keep content as is (empty if no text, or user's text if provided)
          }
          } catch (uploadError: any) {
            console.error('Error uploading files:', uploadError);
            alert(uploadError.message || 'Không thể tải file lên. Vui lòng thử lại.');
            setIsUploading(false);
            // Restore inputs on error
            setInputMessage(messageToSend);
            setSelectedFiles(filesToSend);
            return;
          } finally {
            setIsUploading(false);
          }
        }

        // Send message to both API and Firebase
        await Promise.all([
          // Send to API (for backend storage)
          ChatService.sendMessage(customerId, targetStoreId, {
            senderId: customerId,
            senderType: 'CUSTOMER',
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl,
          }),
          // Send to Firebase (for realtime sync) - Firebase now supports array format
          FirebaseRealtimeChatService.sendMessage(customerId, targetStoreId, {
            senderId: customerId,
            senderType: 'CUSTOMER',
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl, // Send full array or string as is
          })
        ]);

        // Message will be updated automatically via Firebase listener
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Restore inputs on error
      setInputMessage(messageToSend);
      setSelectedFiles(filesToSend);
      
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      if (chatMode === 'ai') {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Only allow in store chat mode
    if (chatMode === 'ai') {
      alert(`Chỉ có thể gửi ${fileType === 'image' ? 'ảnh' : 'video'} khi chat với cửa hàng`);
      return;
    }

    const validFiles: File[] = [];
    
    // Validate all files first
    Array.from(files).forEach((file) => {
      if (fileType === 'image') {
        if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn file ảnh hợp lệ');
          return;
        }
      } else {
        if (!file.type.includes('video/mp4')) {
          alert('Chỉ hỗ trợ định dạng video MP4');
          return;
        }
        const maxSize = 30 * 1024 * 1024; // 30MB
        if (file.size > maxSize) {
          alert('Dung lượng video không được vượt quá 30MB');
          return;
        }
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    // Create previews for all valid files
    const newFiles: Array<{ file: File; preview: string; type: 'image' | 'video' }> = [];
    let loadedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        newFiles.push({ file, preview, type: fileType });
        loadedCount++;
        
        // Update state when all files are processed
        if (loadedCount === validFiles.length) {
          setSelectedFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileType === 'image' && imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    if (fileType === 'video' && videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleClearChat = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?')) {
      if (chatMode === 'ai') {
        setMessages([{
          id: '0',
          role: 'assistant',
          content: 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?',
          timestamp: new Date(),
        }]);
      } else {
        setMessages([{
          id: '0',
          role: 'assistant',
          content: 'Xin chào! Cửa hàng có thể giúp gì cho bạn?',
          timestamp: new Date(),
        }]);
      }
    }
  };

  const handleOpenChat = () => {
    // Check authentication first
    if (!CustomerAuthService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }
    // Toggle mode selector
    setShowModeSelector((prev) => !prev);
  };

  const handleSelectMode = (mode: 'ai' | 'store') => {
    setShowModeSelector(false);
    if (mode === 'ai') {
      setChatMode('ai');
      setMessages([{
        id: '0',
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date(),
      }]);
      setIsOpen(true);
    } else {
      setChatMode('list');
      loadConversations();
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {/* Mode Selector - Show above button when clicked */}
          {showModeSelector && (
            <div className="flex gap-3 animate-scale-in">
              {/* AI Chat Option */}
              <button
                onClick={() => handleSelectMode('ai')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <Bot className="w-5 h-5" />
                <span className="font-semibold text-sm whitespace-nowrap">Chat AI</span>
              </button>

              {/* Store Chat Option */}
              <button
                onClick={() => handleSelectMode('store')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <Store className="w-5 h-5" />
                <span className="font-semibold text-sm whitespace-nowrap">Chat Shop</span>
              </button>
            </div>
          )}

          {/* Main Chat Button */}
        <button
            onClick={handleOpenChat}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 group flex flex-col items-center gap-1.5 px-4 py-3 w-20"
          aria-label="Open chat"
        >
            <MessageSquare className="w-7 h-7 group-hover:animate-pulse" />
            <span className="text-xs font-medium whitespace-nowrap">Chat Ngay</span>
          </button>
          </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[900px] h-[700px] bg-white rounded-2xl shadow-2xl flex z-50 border border-gray-200 overflow-hidden">
          {/* Left Sidebar - Conversations List (only show in list mode) */}
          {chatMode === 'list' && (
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Tin nhắn</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Tìm theo tên shop..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Chưa có tin nhắn</h3>
                    <p className="text-xs text-gray-500">
                      Bạn chưa có cuộc trò chuyện nào với cửa hàng
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        storeId === conv.storeId ? 'bg-orange-50' : ''
                      }`}
                    >
                      {/* Store Avatar */}
                      {conv.storeAvatar ? (
                        <img
                          src={conv.storeAvatar}
                          alt={conv.storeName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = CustomerStoreService.getDefaultAvatar(conv.storeName);
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{conv.storeName}</h4>
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(conv.lastMessageTime).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Back to AI Chat */}
              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={() => switchChatMode('ai')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Chat với AI</span>
                </button>
              </div>
            </div>
          )}

          {/* Right Side - Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Show store avatar and name in list mode if store selected */}
                  {chatMode === 'list' && selectedStore ? (
                    <>
                      {selectedStore.storeAvatar ? (
                        <img
                          src={selectedStore.storeAvatar}
                          alt={selectedStore.storeName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                          onError={(e) => {
                            e.currentTarget.src = CustomerStoreService.getDefaultAvatar(selectedStore.storeName);
                          }}
                        />
                      ) : (
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                          <Store className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{selectedStore.storeName}</h3>
                        <p className="text-xs text-white/80">Cửa hàng</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        {chatMode === 'ai' ? <Bot className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {chatMode === 'ai' ? 'Trợ lý AI' : 'Tin nhắn của bạn'}
                        </h3>
                        <p className="text-xs text-white/80">
                          {chatMode === 'ai' ? 'Tech Hub Assistant' : 'Chọn cửa hàng để chat'}
                        </p>
                      </div>
                    </>
                  )}
            </div>
            <div className="flex items-center gap-2">
                  {/* Clear chat button for AI mode or list mode with selected store */}
                  {(chatMode === 'ai' || (chatMode === 'list' && selectedStore)) && (
              <button
                onClick={handleClearChat}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                title="Xóa cuộc trò chuyện"
              >
                <Trash2 className="w-5 h-5" />
              </button>
                  )}
                  {/* Switch to conversations list from AI mode */}
                  {chatMode === 'ai' && (
                    <button
                      onClick={() => switchChatMode('list')}
                      className="hover:bg-white/20 p-2 rounded-full transition-colors"
                      title="Xem tin nhắn"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                  {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
                </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMode === 'list' && !selectedStore ? (
                // Empty state - no store selected yet
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Chọn một cuộc trò chuyện</h3>
                  <p className="text-sm text-gray-500">
                    Chọn cửa hàng từ danh sách bên trái để bắt đầu chat
                  </p>
                </div>
              ) : (
                // Show messages (both AI and store messages)
                messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-orange-500 to-red-500'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                {message.mediaUrl && (message.messageType === 'IMAGE' || message.messageType === 'VIDEO' || message.messageType === 'MIXED') ? (
                  // Image/Video/MIXED with optional text
                  <div className="max-w-[300px] space-y-2">
                    {/* Handle mediaUrl as array (MIXED) or string (IMAGE/VIDEO) */}
                    {(() => {
                      const isArray = Array.isArray(message.mediaUrl);
                      const isMixed = message.messageType === 'MIXED';
                      
                      // Debug log
                      if (isMixed || isArray) {
                        console.log('🔍 MIXED message detected:', {
                          messageType: message.messageType,
                          isArray,
                          mediaUrl: message.mediaUrl,
                          length: isArray ? (message.mediaUrl as any[]).length : 0,
                          content: message.content
                        });
                      }
                      
                      // If MIXED type or mediaUrl is an array, display as grid
                      if (isMixed || isArray) {
                        // MIXED: Multiple media items
                        const mediaArray = Array.isArray(message.mediaUrl) ? message.mediaUrl : [];
                        
                        // If array is empty but we have a string mediaUrl, convert it
                        if (mediaArray.length === 0 && typeof message.mediaUrl === 'string' && message.mediaUrl) {
                          return (
                            <img
                              src={message.mediaUrl}
                              alt=""
                              className="w-[300px] h-[300px] rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          );
                        }
                        
                        if (mediaArray.length === 0) {
                          return null;
                        }
                        
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            {mediaArray.map((item, index) => {
                              const mediaUrl: string = typeof item === 'string' ? item : (item?.url || '');
                              const mediaType = typeof item === 'string' ? 'image' : (item?.type || 'image');
                              const isVideo = mediaType === 'video' || (mediaUrl && mediaUrl.match(/\.(mp4|webm|ogg)$/i));
                              
                              if (!mediaUrl) return null;
                              
                              return isVideo ? (
                                <video
                                  key={index}
                                  src={mediaUrl}
                                  controls
                                  className="w-full h-[150px] rounded-lg object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                >
                                  Trình duyệt của bạn không hỗ trợ video.
                                </video>
                              ) : (
                                <img
                                  key={index}
                                  src={mediaUrl}
                                  alt=""
                                  className="w-full h-[150px] rounded-lg object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              );
                            })}
                          </div>
                        );
                      } else {
                        // IMAGE/VIDEO: Single media item (string format)
                        if (!message.mediaUrl || typeof message.mediaUrl !== 'string') {
                          return null;
                        }
                        
                        return (
                          <>
                            {message.messageType === 'VIDEO' || message.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video
                                src={message.mediaUrl}
                                controls
                                className="w-[300px] h-[300px] rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              >
                                Trình duyệt của bạn không hỗ trợ video.
                              </video>
                            ) : (
                              <img
                                src={message.mediaUrl}
                                alt=""
                                className="w-[300px] h-[300px] rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </>
                        );
                      }
                    })()}
                    {/* Show text bubble if exists - same style as text message */}
                    {message.content && message.content.trim() && (
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none shadow-md border border-gray-100'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <span
                          className={`text-xs mt-1 block ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    {/* Show timestamp only if no text */}
                    {(!message.content || !message.content.trim()) && (
                      <span
                        className={`text-xs block ${
                          message.role === 'user' ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                ) : (
                  // Text message only - with background bubble
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none shadow-md border border-gray-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <span
                      className={`text-xs mt-1 block ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
                ))
              )}

            {/* Loading Indicator */}
              {isLoading && chatMode !== 'list' && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none shadow-md border border-gray-100 px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
            {(chatMode === 'ai' || (chatMode === 'list' && selectedStore)) && (
              <div className="border-t border-gray-200 bg-white">
            {/* Preview area */}
            {selectedFiles.length > 0 && (
              <div className="p-3 border-b border-gray-200 bg-blue-50">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((fileItem, index) => (
                    <div key={index} className="relative">
                      {fileItem.type === 'video' ? (
                        <video
                          src={fileItem.preview}
                          className="w-[120px] h-[120px] rounded-lg object-cover"
                          controls={false}
                        />
                      ) : (
                        <img
                          src={fileItem.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-[120px] h-[120px] rounded-lg object-cover"
                        />
                      )}
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Xóa"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Add more button */}
                  <button
                    onClick={() => {
                      // For simplicity, just add image. User can click video button separately
                      imageInputRef.current?.click();
                    }}
                    className="w-[120px] h-[120px] rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 flex items-center justify-center bg-white transition-colors"
                    title="Thêm ảnh/video"
                    disabled={isUploading || isLoading}
                  >
                    <div className="text-center">
                      <span className="text-2xl text-gray-400">+</span>
                      <p className="text-xs text-gray-500 mt-1">Thêm</p>
                    </div>
                  </button>
                </div>
                {isUploading && (
                  <div className="flex items-center gap-2 text-blue-600 mt-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Đang tải lên {selectedFiles.length} file...</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-3 flex items-center gap-2">
              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e, 'image')}
                className="hidden"
                disabled={isUploading || isLoading || chatMode === 'ai'}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4"
                multiple
                onChange={(e) => handleFileSelect(e, 'video')}
                className="hidden"
                disabled={isUploading || isLoading || chatMode === 'ai'}
              />
              
              {/* Upload buttons - only show in store chat mode */}
              {chatMode === 'list' && selectedStore && (
                <>
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading || isLoading}
                    className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gửi ảnh"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading || isLoading}
                    className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gửi video"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </>
              )}
              
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                disabled={isLoading || isUploading}
              />
              <button
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isLoading || isUploading}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Send message"
              >
                {isLoading || isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
