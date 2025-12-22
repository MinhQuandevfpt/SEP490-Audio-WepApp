import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, X, Loader2, Trash2, Store, Sparkles, MessageCircle, MessageSquare, Image, Video, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIChatService from '../../services/ai/AIChatService';
import AIProductSearchService, { type ProductSearchResponse, type ProductAdviseResponse } from '../../services/ai/AIProductSearchService';
import ChatService, { type CustomerConversation } from '../../services/customer/ChatService';
import { useChatContext } from '../../contexts/ChatContext';
import { CustomerAuthService } from '../../services/customer/Authcustomer';
import { CustomerStoreService } from '../../services/customer/StoreService';
import FirestoreChatService from '../../services/FirestoreChatService';
import FileUploadService from '../../services/FileUploadService';
import { ProductListService } from '../../services/customer/ProductListService';
import { getCustomerId } from '../../utils/authHelper';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  mediaUrl?: string | Array<{ url: string; type?: string }>;
  read?: boolean; // Message read status
  type?: 'text' | 'product_search' | 'advice' | 'none' | 'product_advise'; // For AI agent responses
  products?: Array<{
    effectivePrice: string;
    productId: string;
    rating: string;
    brand: string;
    name: string;
    summary: string;
  }>;
  productCount?: number;
  // Product info for product_advise type
  productInfo?: {
    productId: string;
    productName: string;
    productImage: string | null;
  };
}

type ChatMode = 'ai' | 'store' | 'list';

// ================== AI Chat localStorage persistence ==================

const AI_CHAT_STORAGE_PREFIX = 'aiChat:session:';

interface StoredAiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string
  messageType?: Message['messageType'];
  type?: Message['type'];
  mediaUrl?: Message['mediaUrl'];
  products?: Message['products'];
  productCount?: number;
  productInfo?: Message['productInfo'];
}

interface StoredAiChatState {
  aiType: 'assistant' | 'agent';
  messages: StoredAiMessage[];
}

const getAiSessionKey = (): string => {
  try {
    const cid = getCustomerId();
    const id = cid || 'guest';
    return `${AI_CHAT_STORAGE_PREFIX}${id}`;
  } catch {
    return `${AI_CHAT_STORAGE_PREFIX}guest`;
  }
};

const loadAiChatFromStorage = ():
  | { aiType: 'assistant' | 'agent'; messages: Message[] }
  | null => {
  try {
    const raw = localStorage.getItem(getAiSessionKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAiChatState;
    if (!parsed || !Array.isArray(parsed.messages)) return null;

    const messages: Message[] = parsed.messages.map((m) => ({
      id: m.id,
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content ?? '',
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      messageType: m.messageType,
      mediaUrl: m.mediaUrl,
      type: m.type,
      products: m.products,
      productCount: m.productCount,
      productInfo: m.productInfo,
    }));

    return {
      aiType: parsed.aiType === 'agent' ? 'agent' : 'assistant',
      messages,
    };
  } catch (error) {
    console.error('[AIChat] Failed to load chat history from storage:', error);
    return null;
  }
};

const saveAiChatToStorage = (messages: Message[], aiType: 'assistant' | 'agent') => {
  try {
    const payload: StoredAiChatState = {
      aiType,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp:
          m.timestamp instanceof Date && !Number.isNaN(m.timestamp.getTime())
            ? m.timestamp.toISOString()
            : new Date().toISOString(),
        messageType: m.messageType,
        type: m.type,
        mediaUrl: m.mediaUrl,
        products: m.products,
        productCount: m.productCount,
        productInfo: m.productInfo,
      })),
    };
    localStorage.setItem(getAiSessionKey(), JSON.stringify(payload));
  } catch (error) {
    console.error('[AIChat] Failed to save chat history to storage:', error);
  }
};

interface ConversationWithStoreInfo extends CustomerConversation {
  storeName: string;
  storeAvatar?: string;
  lastMessageSenderType?: 'CUSTOMER' | 'STORE'; // Track who sent the last message
}

const AIChatbot: React.FC = () => {
  const navigate = useNavigate();
  const chatContext = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('ai');
  const [aiType, setAiType] = useState<'assistant' | 'agent'>('assistant'); // New state for AI type selection
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string; type: 'image' | 'video' }>>([]);
  const [selectedProductForAdvise, setSelectedProductForAdvise] = useState<{
    productId: string;
    productName: string;
    productImage: string | null;
  } | null>(null); // Product selected for advise (shown in preview area)
  const [storeId, setStoreId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationWithStoreInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedStore, setSelectedStore] = useState<ConversationWithStoreInfo | null>(null);
  const [zoomMedia, setZoomMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [currentProductIdForAdvise, setCurrentProductIdForAdvise] = useState<string | null>(null); // Track product ID that was advised to AI
  const [isDraggingOver, setIsDraggingOver] = useState(false); // Track if dragging over chat window
  const [showClearConfirm, setShowClearConfirm] = useState(false); // Show confirmation dialog for clearing chat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null); // For selecting both image and video
  const selectedStoreIdRef = useRef<string | null>(null); // Track selected store ID
  const hasLoadedAiHistoryRef = useRef(false); // Ensure we only hydrate AI history once
  const chatWindowRef = useRef<HTMLDivElement>(null); // Ref for chat window to handle drop events

  // Persist AI chat history in localStorage per (customerId, aiType)
  // Chỉ bắt đầu lưu sau khi đã hydrate/load lịch sử để tránh ghi đè dữ liệu cũ khi reload trang.
  useEffect(() => {
    if (chatMode !== 'ai') return;
    if (!isOpen) return;
    if (!hasLoadedAiHistoryRef.current) return;
    if (!messages || messages.length === 0) return;
    saveAiChatToStorage(messages, aiType);
  }, [messages, aiType, chatMode, isOpen]);

  // Hydrate AI chat history when opening AI chat window
  useEffect(() => {
    if (!isOpen || chatMode !== 'ai') return;
    if (hasLoadedAiHistoryRef.current) return;

    const stored = loadAiChatFromStorage();
    if (stored && stored.messages.length > 0) {
      hasLoadedAiHistoryRef.current = true;
      setAiType(stored.aiType);
      setMessages(stored.messages);
      // Note: productId is not persisted, will be reset when chat opens
      setCurrentProductIdForAdvise(null);
      setSelectedProductForAdvise(null);
      chatContext.setProductIdForAdvise(null);
    } else {
      hasLoadedAiHistoryRef.current = true;
      // Reset productId when opening fresh chat
      setCurrentProductIdForAdvise(null);
      setSelectedProductForAdvise(null);
      chatContext.setProductIdForAdvise(null);
    }
  }, [isOpen, chatMode, chatContext]);

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

  // Listen to context changes - sync local state with context
  useEffect(() => {
    // Sync isOpen state with context
    setIsOpen(chatContext.isOpen);
    
    // When context says chat is open, sync mode and storeId
    if (chatContext.isOpen) {
      // If opening chat with a store, always switch to list mode (to show conversations list)
      if (chatContext.chatMode === 'store') {
        setChatMode('list');
        // Sync storeId if provided
        if (chatContext.storeId) {
          setStoreId(chatContext.storeId);
        }
        // Load conversations will happen in next effect
      } else {
        // For AI mode, sync chatMode
        setChatMode(chatContext.chatMode);
      }
    }
  }, [chatContext.isOpen, chatContext.chatMode, chatContext.storeId]);

  // Load conversations when switching to list mode
  useEffect(() => {
    if (isOpen && chatMode === 'list' && isAuthenticated) {
      // Only auto-select store if we have a storeId from context (from product detail or store page)
      // Don't auto-select if user manually selected a conversation from the list
      if (chatContext.storeId && !selectedStore) {
        // StoreId from context (external trigger), load and select that store
        loadConversationsAndSelectStore();
      } else if (!selectedStore) {
        // No selectedStore yet, just load all conversations (only if list is empty)
        if (conversations.length === 0) {
          loadConversations();
        }
      }
      // If selectedStore already exists, don't reload (user already selected manually)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chatMode, isAuthenticated, chatContext.storeId]);

  // Helper function to detect media type from URL or type field (shared across component)
  const detectMediaType = useCallback((mediaItem: any): 'image' | 'video' => {
    // Check if type field exists and is valid
    if (mediaItem?.type && typeof mediaItem.type === 'string') {
      const type = mediaItem.type.toLowerCase();
      if (type === 'image' || type === 'video') {
        return type;
      }
    }
    
    // If type is "string" or doesn't exist, detect from URL extension
    const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.url || '');
    if (!url) return 'image'; // Default to image
    
    const urlLower = url.toLowerCase();
    
    // Image extensions
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(urlLower)) {
      return 'image';
    }
    
    // Video extensions
    if (/\.(mp4|mov|avi|mkv|webm|ogg)$/i.test(urlLower)) {
      return 'video';
    }
    
    // Default to image if cannot determine
    return 'image';
  }, []);

  // Helper function to format last message text (shared across component)
  const formatLastMessage = useCallback((message: any): string => {
    // If has content, return content (with truncation if needed)
    if (message.content && message.content.trim()) {
      const content = message.content.trim();
      return content.length > 50 ? `${content.substring(0, 50)}...` : content;
    }
    
    // Handle IMAGE type
    if (message.messageType === 'IMAGE') {
      return '[Hình ảnh]';
    }
    
    // Handle VIDEO type
    if (message.messageType === 'VIDEO') {
      return '[Video]';
    }
    
    // Handle MIXED type
    if (message.messageType === 'MIXED') {
      const mediaArray = Array.isArray(message.mediaUrl) ? message.mediaUrl : [];
      if (mediaArray.length === 0) {
        return '[Tin nhắn]';
      }
      
      // Detect all media types in the array
      const mediaTypes = mediaArray.map((item: any) => detectMediaType(item));
      const hasImage = mediaTypes.includes('image');
      const hasVideo = mediaTypes.includes('video');
      
      // If has both image and video, show both
      if (hasImage && hasVideo) {
        return '[Hình ảnh, Video]';
      }
      
      // If only one type, use first item to determine
      const firstType = detectMediaType(mediaArray[0]);
      if (firstType === 'image') {
        return mediaArray.length === 1 ? '[Hình ảnh]' : `[${mediaArray.length} hình ảnh]`;
      } else {
        return mediaArray.length === 1 ? '[Video]' : `[${mediaArray.length} video]`;
      }
    }
    
    return '[Tin nhắn]';
  }, [detectMediaType]);

  // Setup Firebase listeners for all conversations to update lastMessage in realtime
  useEffect(() => {
    if (!isOpen || chatMode !== 'list' || !isAuthenticated || conversations.length === 0) {
      return;
    }

    const customerId = ChatService.getCurrentUserId();
    if (!customerId) return;

    // Setup Firebase listener for each conversation
    const unsubscribes: Array<() => void> = [];

    conversations.forEach((conv) => {
      const unsubscribe = FirestoreChatService.subscribeToMessages(
        customerId,
        conv.storeId,
        (firebaseMessages) => {
          if (firebaseMessages.length === 0) return;

          // Get the latest message
          const latestMessage = firebaseMessages[firebaseMessages.length - 1];
          
          // Format lastMessage text
          const lastMessageText = formatLastMessage(latestMessage);
          
          // Update conversation in the list
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.storeId === conv.storeId) {
                // ALWAYS check if conversation is selected first (using ref for up-to-date value)
                const isSelected = selectedStoreIdRef.current === conv.storeId;
                
                const newLastMessageTime = typeof latestMessage.createdAt === 'string' 
                  ? latestMessage.createdAt 
                  : new Date(latestMessage.createdAt).toISOString();
                
                // Only update if the new message is more recent
                const currentTime = new Date(c.lastMessageTime).getTime();
                const newTime = new Date(newLastMessageTime).getTime();
                
                if (newTime > currentTime) {
                  // If new message is from store and conversation is not selected, increment unreadCount
                  const isFromStore = latestMessage.senderType === 'STORE';
                  const shouldIncrementUnread = isFromStore && !isSelected;
                  
                  return {
                    ...c,
                    lastMessage: lastMessageText,
                    lastMessageTime: newLastMessageTime,
                    lastMessageSenderType: latestMessage.senderType,
                    // ALWAYS keep unreadCount = 0 if conversation is selected, regardless of message
                    customerUnreadCount: isSelected ? 0 : (shouldIncrementUnread 
                      ? (c.customerUnreadCount || 0) + 1 
                      : (c.customerUnreadCount || 0)),
                    unreadCount: isSelected ? 0 : (shouldIncrementUnread 
                      ? (c.customerUnreadCount || 0) + 1 
                      : (c.customerUnreadCount || 0)),
                  };
                } else {
                  // Even if not updating time, ALWAYS ensure unreadCount = 0 if selected
                  return {
                    ...c,
                    customerUnreadCount: isSelected ? 0 : (c.customerUnreadCount || 0),
                    unreadCount: isSelected ? 0 : (c.customerUnreadCount || 0),
                  };
                }
              }
              return c;
            });
            
            // Sort by lastMessageTime (newest first)
            const sorted = updated.sort((a, b) => {
              const timeA = new Date(a.lastMessageTime).getTime();
              const timeB = new Date(b.lastMessageTime).getTime();
              return timeB - timeA;
            });
            
            // Final check: Ensure unreadCount = 0 for selected conversation after sort
            const selectedStoreId = selectedStoreIdRef.current;
            return sorted.map((c) => {
              if (c.storeId === selectedStoreId) {
                return {
                  ...c,
                  customerUnreadCount: 0,
                  unreadCount: 0,
                };
              }
              return c;
            });
          });
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // Cleanup: unsubscribe from all listeners
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
    }, [isOpen, chatMode, isAuthenticated, conversations.map(c => c.storeId).join(','), formatLastMessage]);

  // Get or generate userId for AI chat
  const getUserId = () => {
    let userId = localStorage.getItem('aiChatUserId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('aiChatUserId', userId);
    }
    return userId;
  };

  // Get userId for Agent (first 4 characters of customerId)
  const getAgentUserId = (): string => {
    const customerId = getCustomerId();
    if (!customerId) {
      throw new Error('Customer ID not found. Please login.');
    }
    // Get first 4 characters of customerId
    return customerId.substring(0, 4);
  };

  // Handle drop event when product is dropped into chat
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingOver(false);

    // Only handle in AI Agent mode
    if (chatMode !== 'ai' || aiType !== 'agent') {
      // Show alert if trying to drop in wrong mode
      if (chatMode === 'ai' && aiType === 'assistant') {
        alert('Bạn chỉ có thể kéo thả sản phẩm vào chế độ Chat Agent. Vui lòng chuyển sang chế độ Agent.');
      } else {
        alert('Bạn chỉ có thể kéo thả sản phẩm vào chế độ Chat Agent.');
      }
      return;
    }

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) {
        // Try text/plain as fallback (for compatibility)
        const textData = e.dataTransfer.getData('text/plain');
        if (!textData) return;
        
        try {
          const parsed = JSON.parse(textData);
          if (parsed.productId) {
            // Handle as product data
            const productId = parsed.productId;
            const productName = parsed.productName || 'sản phẩm này';

            // Fetch product info to get image
            let productImage: string | null = null;
            try {
              const productResponse = await ProductListService.getProductById(productId);
              if (productResponse?.data) {
                productImage = productResponse.data.images && productResponse.data.images.length > 0
                  ? productResponse.data.images[0]
                  : productResponse.data.thumbnailUrl || null;
              }
            } catch (error) {
              console.warn('[AIChat] Failed to fetch product image:', error);
            }

            // Save product to preview area
            setSelectedProductForAdvise({
              productId,
              productName,
              productImage,
            });

            setCurrentProductIdForAdvise(productId);
            chatContext.setProductIdForAdvise(productId);

            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
            return;
          }
        } catch {
          // Not valid JSON, ignore
          return;
        }
        return;
      }

      const dropData = JSON.parse(data);
      if (dropData.type !== 'product' || !dropData.productId) {
        return;
      }

      const productId = dropData.productId;
      const productName = dropData.productName || 'sản phẩm này';

      // Prevent adding the same product multiple times
      if (selectedProductForAdvise?.productId === productId) {
        // Product already selected, just focus input
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return;
      }

      // Fetch product info to get image
      let productImage: string | null = null;
      try {
        const productResponse = await ProductListService.getProductById(productId);
        if (productResponse?.data) {
          // Get first image from images array or thumbnailUrl
          productImage = productResponse.data.images && productResponse.data.images.length > 0
            ? productResponse.data.images[0]
            : productResponse.data.thumbnailUrl || null;
        }
      } catch (error) {
        console.warn('[AIChat] Failed to fetch product image:', error);
        // Continue without image
      }

      // Save product to preview area (will be advised when user sends message)
      setSelectedProductForAdvise({
        productId,
        productName,
        productImage,
      });

      // Set productId for tracking
      setCurrentProductIdForAdvise(productId);
      chatContext.setProductIdForAdvise(productId);

      console.log('========================================');
      console.log('📦 [AIChat] Product dropped into chat');
      console.log('========================================');
      console.log('Product Info:', {
        productId,
        productName,
        productImage,
      });
      console.log('Note: API /api/ai/products/api/products/advise will be called when you send a message');
      console.log('========================================\n');

      // Auto-focus input after drop
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error: any) {
      console.error('Error handling product drop:', error);
      setIsDraggingOver(false);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Xin lỗi, không thể thêm sản phẩm vào ngữ cảnh. Vui lòng thử lại.',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow drop in AI Agent mode
    if (chatMode === 'ai' && aiType === 'agent') {
      e.dataTransfer.dropEffect = 'copy';
      setIsDraggingOver(true);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setIsDraggingOver(false);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only reset if leaving the chat window (not just moving to child element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingOver(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show visual feedback in AI Agent mode
    if (chatMode === 'ai' && aiType === 'agent') {
      setIsDraggingOver(true);
    }
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

  // Note: Store messages loading is handled by the effect below when selectedStore changes

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

  // Update ref when selectedStore changes
  useEffect(() => {
    selectedStoreIdRef.current = selectedStore?.storeId || null;
  }, [selectedStore]);

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
            read: msg.read !== undefined ? msg.read : false, // Default to false if not provided
          }));
          setMessages(loadedMessages);
          
          // Update lastMessageSenderType from the last message
          const lastMessage = loadedMessages[loadedMessages.length - 1];
          if (lastMessage && response.data && response.data.length > 0) {
            const lastApiMessage = response.data[response.data.length - 1];
            setConversations((prev) => 
              prev.map((conv) => {
                if (conv.storeId === selectedStore.storeId) {
                  // Always ensure unreadCount = 0 for selected conversation
                  const isSelected = selectedStoreIdRef.current === conv.storeId;
                  return { 
                    ...conv, 
                    lastMessageSenderType: lastApiMessage.senderType,
                    customerUnreadCount: isSelected ? 0 : (conv.customerUnreadCount || 0),
                    unreadCount: isSelected ? 0 : (conv.unreadCount || 0),
                  };
                }
                return conv;
              })
            );
          }
          
          setIsLoading(false);
          
          // Mark messages as read when opening conversation (async, doesn't block UI)
          // unreadCount already updated in handleSelectConversation
          Promise.all([
            ChatService.markAsRead(customerId, selectedStore.storeId, customerId),
            // Also update read status in Firestore for messages from STORE
            FirestoreChatService.updateMessagesReadStatus(customerId, selectedStore.storeId, 'STORE')
          ]).catch(() => {
            // Silent fail
          });
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
        setIsLoading(false);
      }
    };

    loadInitialMessages();

    // Subscribe to Firestore realtime updates
    // Firestore now supports full mediaUrl array, so we can use it directly
    const unsubscribe = FirestoreChatService.subscribeToMessages(
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
            read: msg.read !== undefined ? msg.read : false, // Default to false if not provided
            };
            
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
        read: msg.read !== undefined ? msg.read : false, // Default to false if not provided
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
      
      // Fetch store info (name + avatar) and format last message
      const conversationsWithStoreInfo = await Promise.all(
        convList.map(async (conv) => {
          try {
            const storeDetail = await CustomerStoreService.getStoreById(conv.storeId);
            
            // Get last message to format it properly
            let formattedLastMessage = conv.lastMessage || '';
            try {
              // Fetch last message to get full message data for formatting
              const messagesResponse = await ChatService.getMessages(customerId, conv.storeId, 1);
              if (messagesResponse.data && messagesResponse.data.length > 0) {
                const lastMsg = messagesResponse.data[messagesResponse.data.length - 1];
                formattedLastMessage = formatLastMessage(lastMsg);
              } else if (conv.lastMessage) {
                // If API doesn't return messages but has lastMessage, try to format it
                // This handles case where lastMessage is already formatted text
                formattedLastMessage = conv.lastMessage;
              }
            } catch (error) {
              // Fallback to API's lastMessage
              formattedLastMessage = conv.lastMessage || '';
            }
            
            return {
              ...conv,
              storeName: storeDetail.storeName || `Shop ${conv.storeId.substring(0, 8)}`,
              storeAvatar: storeDetail.logoUrl || CustomerStoreService.getDefaultAvatar(storeDetail.storeName),
              lastMessage: formattedLastMessage,
            };
          } catch (error) {
            return {
              ...conv,
              storeName: `Shop ${conv.storeId.substring(0, 8)}`,
              storeAvatar: CustomerStoreService.getDefaultAvatar(`Shop ${conv.storeId.substring(0, 8)}`),
            };
          }
        })
      );

      // Preserve unreadCount = 0 for selected conversation
      const selectedStoreId = selectedStoreIdRef.current;
      const conversationsWithPreservedUnread = conversationsWithStoreInfo.map((conv) => {
        // If this conversation is currently selected, always set unreadCount = 0
        if (conv.storeId === selectedStoreId) {
          return {
            ...conv,
            customerUnreadCount: 0,
            unreadCount: 0,
          };
        }
        return conv;
      });
      
      setConversations(conversationsWithPreservedUnread);
      return conversationsWithPreservedUnread;
    } catch (error) {
      setConversations([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationsAndSelectStore = async () => {
    const convList = await loadConversations();
    
    // Use storeId from context if available, otherwise use local state
    const targetStoreId = chatContext.storeId || storeId;
    
    // If we have a storeId from context or state
    if (targetStoreId) {
      // Try to find existing conversation
      const targetConv = convList?.find(conv => conv.storeId === targetStoreId);
      
      if (targetConv) {
        // Found existing conversation, select it
        setSelectedStore(targetConv);
        // Also update local storeId to keep in sync
        if (targetStoreId !== storeId) {
          setStoreId(targetStoreId);
        }
      } else {
        // No existing conversation (either convList is empty or store not in list)
        // Create a new one by fetching store info
        try {
          const storeDetail = await CustomerStoreService.getStoreById(targetStoreId);
          const newConv: ConversationWithStoreInfo = {
            id: `${ChatService.getCurrentUserId()}_${targetStoreId}`,
            storeId: targetStoreId,
            customerId: ChatService.getCurrentUserId() || '',
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            storeName: storeDetail.storeName || `Shop ${targetStoreId.substring(0, 8)}`,
            storeAvatar: storeDetail.logoUrl || CustomerStoreService.getDefaultAvatar(storeDetail.storeName),
          };
          setSelectedStore(newConv);
          // Add to conversations list
          setConversations(prev => [newConv, ...prev]);
          // Also update local storeId to keep in sync
          if (targetStoreId !== storeId) {
            setStoreId(targetStoreId);
          }
        } catch (error) {
          // Silent fail
        }
      }
    }
  };

  const switchChatMode = (mode: ChatMode) => {
    setChatMode(mode);
    chatContext.openChat(mode === 'store' ? mode : 'ai', storeId || undefined);
    
    if (mode === 'ai') {
      const stored = loadAiChatFromStorage();
      if (stored && stored.messages.length > 0) {
        hasLoadedAiHistoryRef.current = true;
        setAiType(stored.aiType);
        setMessages(stored.messages);
      } else {
        const welcomeMessage =
          aiType === 'agent'
            ? 'Xin chào! Tôi là Chat Agent, chuyên tư vấn về sản phẩm âm thanh. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn setup phòng nghe, và phối ghép thiết bị. Bạn cần tư vấn gì?'
            : 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?';
        hasLoadedAiHistoryRef.current = true;
        setMessages([
          {
            id: '0',
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
            type: 'text',
          },
        ]);
      }
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
    // Skip if already selected to avoid unnecessary re-renders
    if (selectedStoreIdRef.current === conv.storeId) return;
    
    // Update ref immediately for other functions to use
    selectedStoreIdRef.current = conv.storeId;
    
    // Batch all state updates together - React will batch these automatically
    // But we order them logically: storeId first, then selectedStore
    setStoreId(conv.storeId);
    setSelectedStore(conv);
    
    // Update unreadCount to 0 immediately when clicking (optimistic update)
    // This happens in a separate update but React should batch it
    setConversations((prev) => 
      prev.map((c) => 
        c.storeId === conv.storeId
          ? { ...c, customerUnreadCount: 0, unreadCount: 0 }
          : c
      )
    );
    // Messages will be loaded by the effect when selectedStore changes
  };

  const handleSendMessage = async () => {
    // Check if there's text, files, or product to send
    const hasText = inputMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    const hasProduct = selectedProductForAdvise !== null;

    // For AI Agent mode, require either text or product
    if (chatMode === 'ai' && aiType === 'agent') {
      if (!hasText && !hasProduct) return;
    } else {
      // For other modes, require text or files
      if (!hasText && !hasFiles) return;
    }

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
        
        // Save product info before clearing selectedProductForAdvise
        const productInfoForMessage = selectedProductForAdvise ? {
          productId: selectedProductForAdvise.productId,
          productName: selectedProductForAdvise.productName,
          productImage: selectedProductForAdvise.productImage,
        } : undefined;
        
        // Add user message immediately for AI chat
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: messageToSend,
          timestamp: new Date(),
          type: 'text',
          productInfo: productInfoForMessage, // Include product info if attached
        };
        setMessages((prev) => [...prev, userMessage]);
        
        // Check AI type: assistant or agent
        if (aiType === 'agent') {
          const userId = getAgentUserId();
          
          // STEP 1: If there's a selected product, advise AI about it FIRST
          // This must be called BEFORE searchProducts to set the product context
          if (selectedProductForAdvise && selectedProductForAdvise.productId !== currentProductIdForAdvise) {
            console.log('========================================');
            console.log('🎯 [AIChat] STEP 1: Calling adviseProduct API');
            console.log('========================================');
            console.log('📋 Context Before Advise:');
            console.log('  - User ID:', userId);
            console.log('  - Product ID:', selectedProductForAdvise.productId);
            console.log('  - Product Name:', selectedProductForAdvise.productName);
            console.log('  - Product Image:', selectedProductForAdvise.productImage);
            console.log('  - Current Product ID (advised):', currentProductIdForAdvise);
            console.log('  - Will call adviseProduct API: YES');
            console.log('----------------------------------------');
            
            try {
              const adviseResponse: ProductAdviseResponse = await AIProductSearchService.adviseProduct({
                userId,
                productId: selectedProductForAdvise.productId,
              });

              console.log('✅ [AIChat] STEP 1 COMPLETED: Product advised successfully');
              console.log('📋 Advise Response Summary:');
              console.log('  - Message:', adviseResponse.message);
              console.log('  - Product ID:', adviseResponse.product?.productId);
              console.log('  - Product Name:', adviseResponse.product?.name);
              console.log('  - Brand Name:', adviseResponse.product?.brandName);
              console.log('  - Categories Count:', adviseResponse.product?.categories?.length || 0);
              console.log('  - Attributes Count:', adviseResponse.product?.attributes?.length || 0);
              console.log('========================================\n');

              // Update currentProductIdForAdvise to track that this product has been advised
              setCurrentProductIdForAdvise(selectedProductForAdvise.productId);
              chatContext.setProductIdForAdvise(selectedProductForAdvise.productId);

              // Add system message showing product was added to context
              const systemMessageContent = adviseResponse.message 
                ? `✅ ${adviseResponse.message}`
                : `✅ Đã thêm sản phẩm "${selectedProductForAdvise.productName}" vào ngữ cảnh.`;
              
              const systemMessage: Message = {
                id: (Date.now() - 1).toString(),
                role: 'assistant',
                content: systemMessageContent,
                timestamp: new Date(),
                type: 'text',
              };

              setMessages((prev) => [...prev, systemMessage]);
            } catch (error: any) {
              console.error('========================================');
              console.error('❌ [AIChat] STEP 1 FAILED: Error advising product');
              console.error('========================================');
              console.error('Error Details:');
              console.error('  - Status:', error?.status || error?.response?.status || 'Unknown');
              console.error('  - Error Object:', error);
              console.error('  - Error Data:', error?.data || error?.response?.data || 'No error data');
              console.error('  - Error Message:', error?.message || 'Unknown error');
              console.error('⚠️  Continuing with searchProducts anyway...');
              console.error('========================================\n');
              // Continue with search even if advise fails
            }
          } else {
            console.log('========================================');
            console.log('ℹ️  [AIChat] STEP 1 SKIPPED: adviseProduct not called');
            console.log('========================================');
            console.log('📋 Skip Reason:');
            console.log('  - Has Selected Product:', !!selectedProductForAdvise);
            console.log('  - Selected Product ID:', selectedProductForAdvise?.productId || 'N/A');
            console.log('  - Current Product ID (advised):', currentProductIdForAdvise || 'N/A');
            console.log('  - Is Same Product:', selectedProductForAdvise?.productId === currentProductIdForAdvise);
            console.log('  - Decision: Product already advised or no product selected');
            console.log('========================================\n');
          }

          // Clear selected product from preview after sending (but keep currentProductIdForAdvise for context)
          setSelectedProductForAdvise(null);

          // STEP 2: Agent: Product Search API
          // Note: API will automatically use productId from previous adviseProduct call (via userId)
          console.log('========================================');
          console.log('💬 [AIChat] STEP 2: Calling searchProducts API');
          console.log('========================================');
          console.log('📋 Context Before Search:');
          console.log('  - User ID:', userId);
          console.log('  - Question:', messageToSend);
          console.log('  - Current Product ID (advised):', currentProductIdForAdvise || 'N/A');
          console.log('  - Has Product Context:', !!currentProductIdForAdvise);
          console.log('  - Note: If product was advised in STEP 1, AI will use it as context');
          console.log('----------------------------------------');
          
          try {
            const response: ProductSearchResponse = await AIProductSearchService.searchProducts({
              userId,
              question: messageToSend,
            });
            
            console.log('✅ [AIChat] STEP 2 COMPLETED: Search completed');
            console.log('📋 Search Response Summary:');
            console.log('  - Mode:', response.mode);
            console.log('  - Question:', response.question);
            if (response.mode === 'product_search' && response.result) {
              console.log('  - Products Found:', response.result.count);
              console.log('  - Product IDs:', response.result.productIds);
              console.log('  - Message:', response.result.message);
            } else if (response.mode === 'advice' && response.reply) {
              console.log('  - Advice Mode: YES');
              console.log('  - Reply Length:', response.reply?.length || 0, 'characters');
              console.log('  - Reply Preview:', response.reply?.substring(0, 100) + '...');
            } else if (response.mode === 'none' && response.reply) {
              console.log('  - None Mode: YES (out of scope)');
              console.log('  - Reply:', response.reply);
            }
            console.log('========================================\n');

            // Handle different response modes
            let assistantMessage: Message;

            if (response.mode === 'product_search' && response.result) {
              // Product search mode
              assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.result.message || `Tìm thấy ${response.result.count} sản phẩm phù hợp:`,
                timestamp: new Date(),
                type: 'product_search',
                products: response.result.items,
                productCount: response.result.count,
              };
            } else if (response.mode === 'advice' && response.reply) {
              // Advice mode
              assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.reply,
                timestamp: new Date(),
                type: 'advice',
              };
            } else if (response.mode === 'none' && response.reply) {
              // None mode (out of scope)
              assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.reply,
                timestamp: new Date(),
                type: 'none',
              };
            } else {
              // Fallback
              assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Xin lỗi, tôi không thể xử lý câu hỏi này. Vui lòng thử lại với câu hỏi khác.',
                timestamp: new Date(),
                type: 'text',
              };
            }

            setMessages((prev) => [...prev, assistantMessage]);
          } catch (agentError: any) {
            console.error('Error calling Agent API:', agentError);
            
            // Check for quota exceeded error (429 or RESOURCE_EXHAUSTED)
            const isQuotaExceeded = 
              agentError?.status === 429 ||
              agentError?.data?.status === 'RESOURCE_EXHAUSTED' ||
              (agentError?.message && (
                agentError.message.toLowerCase().includes('quota') ||
                agentError.message.toLowerCase().includes('exceeded') ||
                agentError.message.toLowerCase().includes('resource_exhausted') ||
                agentError.message.toLowerCase().includes('rate limit')
              )) ||
              (agentError?.data?.error?.status === 'RESOURCE_EXHAUSTED') ||
              (agentError?.data?.error?.code === 429);
            
            let errorContent: string;
            if (isQuotaExceeded) {
              errorContent = 'Hết dung lượng hỏi AI rồi nha bạn! Hãy quay lại sau 1 thời gian nữa nha. Xin lỗi vì sự bất tiện này :(';
            } else {
              errorContent = agentError?.message || 'Xin lỗi, đã có lỗi xảy ra khi tìm kiếm sản phẩm. Vui lòng thử lại sau.';
            }
            
            const errorMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: errorContent,
              timestamp: new Date(),
              type: 'text',
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
        } else {
          // Assistant: Regular AI Chat
          const aiRequestPayload = {
            userId: getUserId(),
            message: messageToSend,
            userName: 'Guest',
          };
          console.info('[AIChat] request /api/ai/chat', aiRequestPayload);
          const response = await AIChatService.sendMessage(aiRequestPayload);
          console.info('[AIChat] response /api/ai/chat', response);

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.answer,
            timestamp: new Date(),
            type: 'text',
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }

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
            mediaUrl = uploadedMedia; // Always use array format for API
            content = ''; // Empty content when only media is sent
          } else {
            // Multiple files or has text - use MIXED
            messageType = 'MIXED';
            mediaUrl = uploadedMedia;
            // Keep content as is (empty if no text, or user's text if provided)
          }
          
          } catch (uploadError: any) {
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
          // Send to Firestore (for realtime sync) - Firestore now supports array format
          FirestoreChatService.sendMessage(customerId, targetStoreId, {
            senderId: customerId,
            senderType: 'CUSTOMER',
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl, // Send full array or string as is
            read: false, // Default to false when sending
          })
        ]);
        
        // Helper function to detect media type from URL or type field
        const detectMediaTypeForMessage = (mediaItem: any): 'image' | 'video' => {
          // Check if type field exists and is valid
          if (mediaItem?.type && typeof mediaItem.type === 'string') {
            const type = mediaItem.type.toLowerCase();
            if (type === 'image' || type === 'video') {
              return type;
            }
          }
          
          // If type is "string" or doesn't exist, detect from URL extension
          const url = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.url || '');
          if (!url) return 'image'; // Default to image
          
          const urlLower = url.toLowerCase();
          
          // Image extensions
          if (/\.(jpg|jpeg|png|webp|gif)$/i.test(urlLower)) {
            return 'image';
          }
          
          // Video extensions
          if (/\.(mp4|mov|avi|mkv|webm|ogg)$/i.test(urlLower)) {
            return 'video';
          }
          
          // Default to image if cannot determine
          return 'image';
        };

        // Update conversation list immediately with the new last message
        const formatLastMessageText = (): string => {
          // If has content, return content (with truncation if needed)
          if (content && content.trim()) {
            const contentText = content.trim();
            return contentText.length > 50 ? `${contentText.substring(0, 50)}...` : contentText;
          }
          
          // Handle IMAGE type
          if (messageType === 'IMAGE') {
            return '[Hình ảnh]';
          }
          
          // Handle VIDEO type
          if (messageType === 'VIDEO') {
            return '[Video]';
          }
          
          // Handle MIXED type
          if (messageType === 'MIXED') {
            const mediaArray = Array.isArray(mediaUrl) ? mediaUrl : [];
            if (mediaArray.length === 0) {
              return '[Tin nhắn]';
            }
            
            // Detect all media types in the array
            const mediaTypes = mediaArray.map(item => detectMediaTypeForMessage(item));
            const hasImage = mediaTypes.includes('image');
            const hasVideo = mediaTypes.includes('video');
            
            // If has both image and video, show both
            if (hasImage && hasVideo) {
              return '[Hình ảnh, Video]';
            }
            
            // If only one type, use first item to determine
            const firstType = detectMediaTypeForMessage(mediaArray[0]);
            if (firstType === 'image') {
              return mediaArray.length === 1 ? '[Hình ảnh]' : `[${mediaArray.length} hình ảnh]`;
            } else {
              return mediaArray.length === 1 ? '[Video]' : `[${mediaArray.length} video]`;
            }
          }
          
          return '[Tin nhắn]';
        };
        
        setConversations((prev) => 
          prev.map((conv) => 
            conv.storeId === targetStoreId
              ? {
                  ...conv,
                  lastMessage: formatLastMessageText(),
                  lastMessageTime: new Date().toISOString(),
                  lastMessageSenderType: 'CUSTOMER' as 'CUSTOMER' | 'STORE',
                }
              : conv
          ).sort((a, b) => {
            const timeA = new Date(a.lastMessageTime).getTime();
            const timeB = new Date(b.lastMessageTime).getTime();
            return timeB - timeA;
          })
        );

        // Message will be updated automatically via Firebase listener
      }
    } catch (error: any) {
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
        // Check both MIME type and file extension for video
        const isVideoMimeType = file.type.startsWith('video/');
        const isVideoExtension = /\.(mp4|webm|ogg|mov|avi)$/i.test(file.name);
        
        if (!isVideoMimeType && !isVideoExtension) {
          alert('Vui lòng chọn file video hợp lệ (MP4, WebM, OGG, MOV, AVI)');
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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Only allow in store chat mode
    if (chatMode === 'ai') {
      alert('Chỉ có thể gửi ảnh/video khi chat với cửa hàng');
      return;
    }

    const validFiles: Array<{ file: File; type: 'image' | 'video' }> = [];
    
    // Validate and categorize all files
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        validFiles.push({ file, type: 'image' });
      } else if (file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi)$/i.test(file.name)) {
        // Check video file size
        const maxSize = 30 * 1024 * 1024; // 30MB
        if (file.size > maxSize) {
          alert(`Video "${file.name}" có dung lượng quá lớn (tối đa 30MB)`);
          return;
        }
        validFiles.push({ file, type: 'video' });
      } else {
        alert(`File "${file.name}" không phải là ảnh hoặc video hợp lệ.`);
        return;
      }
    });

    if (validFiles.length === 0) {
      // Reset input
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
      return;
    }

    // Create previews for all valid files
    const newFiles: Array<{ file: File; preview: string; type: 'image' | 'video' }> = [];
    let loadedCount = 0;

    validFiles.forEach((fileItem) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        newFiles.push({ file: fileItem.file, preview, type: fileItem.type });
        loadedCount++;
        
        // Update state when all files are processed
        if (loadedCount === validFiles.length) {
          setSelectedFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(fileItem.file);
    });

    // Reset input
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveProduct = () => {
    setSelectedProductForAdvise(null);
    setCurrentProductIdForAdvise(null);
    chatContext.setProductIdForAdvise(null);
  };


  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    setShowClearConfirm(false);
    
    if (chatMode === 'ai') {
      // Reset productId and selected product when clearing chat
      setCurrentProductIdForAdvise(null);
      setSelectedProductForAdvise(null);
      chatContext.setProductIdForAdvise(null);
      
      const welcomeMessage = aiType === 'agent' 
        ? 'Xin chào! Tôi là Chat Agent, chuyên tư vấn về sản phẩm âm thanh. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn setup phòng nghe, và phối ghép thiết bị. Bạn cần tư vấn gì?'
        : 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?';
      setMessages([{
        id: '0',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        type: 'text',
      }]);
    } else {
      setMessages([{
        id: '0',
        role: 'assistant',
        content: 'Xin chào! Cửa hàng có thể giúp gì cho bạn?',
        timestamp: new Date(),
      }]);
    }
  };

  const cancelClearChat = () => {
    setShowClearConfirm(false);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleAiTypeChange = (type: 'assistant' | 'agent') => {
    setAiType(type);

    // Reset productId and selected product when switching AI type
    if (type === 'assistant') {
      setCurrentProductIdForAdvise(null);
      setSelectedProductForAdvise(null);
      chatContext.setProductIdForAdvise(null);
    }

    const assistantWelcome =
      'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?';
    const agentWelcome =
      'Xin chào! Tôi là Chat Agent, chuyên tư vấn về sản phẩm âm thanh. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn setup phòng nghe, và phối ghép thiết bị. Bạn cần tư vấn gì?';

    // Nếu hiện tại chỉ có đúng 1 tin nhắn welcome ban đầu thì thay nội dung theo AI type mới,
    // còn nếu đã có lịch sử chat thì giữ nguyên lịch sử, chỉ đổi "não" trả lời cho các tin nhắn tiếp theo.
    setMessages((prev) => {
      if (
        prev.length === 1 &&
        prev[0].role === 'assistant' &&
        prev[0].type === 'text'
      ) {
        return [
          {
            ...prev[0],
            content: type === 'agent' ? agentWelcome : assistantWelcome,
            timestamp: new Date(),
          },
        ];
      }
      return prev;
    });
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

      // Thử khôi phục lịch sử chat AI từ localStorage
      const stored = loadAiChatFromStorage();
      if (stored && stored.messages.length > 0) {
        hasLoadedAiHistoryRef.current = true;
        setAiType(stored.aiType);
        setMessages(stored.messages);
      } else {
        const welcomeMessage =
          aiType === 'agent'
            ? 'Xin chào! Tôi là Chat Agent, chuyên tư vấn về sản phẩm âm thanh. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn setup phòng nghe, và phối ghép thiết bị. Bạn cần tư vấn gì?'
            : 'Xin chào! Tôi là trợ lý AI của Tech Hub. Tôi có thể giúp gì cho bạn?';
        hasLoadedAiHistoryRef.current = true;
        setMessages([
          {
            id: '0',
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
            type: 'text',
          },
        ]);
      }

      // Mở chat AI thông qua ChatContext để các component khác (ví dụ ChatAgent) nắm trạng thái
      chatContext.openChat('ai');
      setIsOpen(true);
    } else {
      // Với chat cửa hàng, đánh dấu ChatContext ở mode 'store' trước
      chatContext.openChat('store', storeId || undefined);
      // Set chatMode to 'list' để hiển thị danh sách conversations
      setChatMode('list');
      setIsOpen(true);
      // loadConversations will be triggered by the effect when conditions are met
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
        <div 
          ref={chatWindowRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`fixed bottom-6 right-6 w-[900px] h-[700px] bg-white rounded-2xl shadow-2xl flex z-50 border-2 overflow-hidden transition-all ${
            isDraggingOver && chatMode === 'ai' && aiType === 'agent'
              ? 'border-orange-500 border-dashed bg-orange-50'
              : 'border-gray-200'
          }`}
        >
          {/* Left Sidebar - Conversations List (only show in list mode) */}
          {chatMode === 'list' && (
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Tin nhắn</h3>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      chatContext.closeChat();
                    }}
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
                      
                      <div className="flex-1 min-w-0 text-left overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{conv.storeName}</h4>
                          {(conv.customerUnreadCount || conv.unreadCount || 0) > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 px-1.5">
                              {conv.customerUnreadCount || conv.unreadCount || 0}
                            </span>
                          )}
                        </div>
                        <p 
                          className={`text-xs truncate max-w-full ${
                            // If has unread count, show last message in black (assume it's from store)
                            (conv.customerUnreadCount || conv.unreadCount || 0) > 0
                              ? 'text-black font-semibold' 
                              : 'text-gray-500'
                          }`} 
                          title={conv.lastMessage}
                        >
                          {conv.lastMessage && conv.lastMessage.length > 50 
                            ? `${conv.lastMessage.substring(0, 50)}...` 
                            : conv.lastMessage}
                        </p>
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
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          {chatMode === 'ai' ? (aiType === 'agent' ? 'Chat Agent' : 'Trợ lý AI') : 'Tin nhắn của bạn'}
                        </h3>
                        <p className="text-xs text-white/80">
                          {chatMode === 'ai' 
                            ? (aiType === 'agent' 
                              ? (currentProductIdForAdvise 
                                ? 'Đang tư vấn về sản phẩm' 
                                : 'Tư vấn sản phẩm âm thanh')
                              : 'Tech Hub Assistant') 
                            : 'Chọn cửa hàng để chat'}
                        </p>
                      </div>
                      {/* AI Type Selector - Only show in AI mode */}
                      {chatMode === 'ai' && (
                        <div className="flex items-center gap-2 bg-white/20 rounded-lg p-1 backdrop-blur-sm">
                          <button
                            onClick={() => handleAiTypeChange('assistant')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              aiType === 'assistant'
                                ? 'bg-white text-orange-500 shadow-md'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            Trợ lý
                          </button>
                          <button
                            onClick={() => handleAiTypeChange('agent')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              aiType === 'agent'
                                ? 'bg-white text-orange-500 shadow-md'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            Agent
                          </button>
                        </div>
                      )}
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
                    onClick={() => {
                      setIsOpen(false);
                      chatContext.closeChat();
                    }}
                    className="hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-w-0">
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
                messages.map((message) => {
                  return (
              <div
                key={message.id}
                className={`flex gap-3 min-w-0 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Message Bubble */}
                {message.type === 'product_search' && message.products ? (
                  // Product search results
                  <div className="max-w-[85%] min-w-0 space-y-3">
                    {/* Message text */}
                    {message.content && (
                      <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none shadow-md border border-gray-100 px-4 py-2">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    )}
                    
                    {/* Products list */}
                    <div className="space-y-2">
                      {message.products.map((product) => (
                        <div
                          key={product.productId}
                          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleProductClick(product.productId)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900 truncate">
                                  {product.name}
                                </span>
                                <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                                  {product.brand}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {product.summary}
                              </p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-semibold text-orange-600">
                                  {product.effectivePrice}
                                </span>
                                <span className="text-gray-500">
                                  {product.rating}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ) : message.mediaUrl && (message.messageType === 'IMAGE' || message.messageType === 'VIDEO' || message.messageType === 'MIXED') ? (
                  // Image/Video/MIXED with optional text
                  <div className="max-w-[300px] min-w-0 space-y-2">
                    {/* Show text bubble first if exists */}
                    {message.content && message.content.trim() && (
                      <div
                        className={`rounded-2xl px-4 py-2 min-w-0 ${
                    message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none shadow-md border border-gray-100'
                        }`}
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {message.content}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className={`text-xs ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {message.role === 'user' && (
                            <span className="text-xs text-blue-100">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Handle mediaUrl as array (MIXED) or string (IMAGE/VIDEO) */}
                    {(() => {
                      const isArray = Array.isArray(message.mediaUrl);
                      const isMixed = message.messageType === 'MIXED';
                      
                      // If MIXED type or mediaUrl is an array, display vertically
                      if (isMixed || isArray) {
                        // MIXED: Multiple media items
                        const mediaArray = Array.isArray(message.mediaUrl) ? message.mediaUrl : [];
                        
                            // If array is empty but we have a string mediaUrl, convert it
                            if (mediaArray.length === 0 && typeof message.mediaUrl === 'string' && message.mediaUrl) {
                              const isVideo = message.messageType === 'VIDEO' || message.mediaUrl.match(/\.(mp4|webm|ogg)$/i);
                              return (
                                <>
                                  {isVideo ? (
                                    <video
                                      src={message.mediaUrl}
                                      controls
                                      className="w-[300px] h-[300px] rounded-lg object-cover cursor-pointer"
                                      onClick={() => setZoomMedia({ url: message.mediaUrl as string, type: 'video' })}
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
                                      className="w-[300px] h-[300px] rounded-lg object-cover cursor-pointer"
                                      onClick={() => setZoomMedia({ url: message.mediaUrl as string, type: 'image' })}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  {/* Show timestamp and read status if no text */}
                                  {(!message.content || !message.content.trim()) && (
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`text-xs ${
                                          message.role === 'user' ? 'text-blue-600' : 'text-gray-400'
                                        }`}
                                      >
                                        {message.timestamp.toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                      {message.role === 'user' && (
                                        <span className="text-xs text-blue-600">
                                          {message.read ? '✓✓' : '✓'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            }
                        
                        if (mediaArray.length === 0) {
                          return null;
                        }
                        
                        return (
                          <>
                            {/* Display media items vertically */}
                            <div className="flex flex-col gap-2">
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
                                    className="w-[300px] h-[300px] rounded-lg object-cover cursor-pointer"
                                    onClick={() => setZoomMedia({ url: mediaUrl, type: 'video' })}
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
                                    className="w-[300px] h-[300px] rounded-lg object-cover cursor-pointer"
                                    onClick={() => setZoomMedia({ url: mediaUrl, type: 'image' })}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                );
                              })}
                </div>
                            {/* Show timestamp and read status if no text */}
                            {(!message.content || !message.content.trim()) && (
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-xs ${
                                    message.role === 'user' ? 'text-blue-600' : 'text-gray-400'
                                  }`}
                                >
                                  {message.timestamp.toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {message.role === 'user' && (
                                  <span className="text-xs text-blue-600">
                                    {message.read ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        );
                      } else {
                        // IMAGE/VIDEO: Handle both string and array format
                        // If mediaUrl is array, take first item
                        let mediaUrlString: string | null = null;
                        
                        if (Array.isArray(message.mediaUrl)) {
                          // Array format - take first item
                          if (message.mediaUrl.length > 0) {
                            const firstItem = message.mediaUrl[0];
                            mediaUrlString = typeof firstItem === 'string' ? firstItem : (firstItem?.url || null);
                          }
                        } else if (typeof message.mediaUrl === 'string') {
                          // String format
                          mediaUrlString = message.mediaUrl;
                        }
                        
                        if (!mediaUrlString) {
                          return null;
                        }
                        
                        const isVideo = message.messageType === 'VIDEO' || mediaUrlString.match(/\.(mp4|webm|ogg)$/i);
                        
                        return (
                          <>
                            {isVideo ? (
                              <video
                                src={mediaUrlString}
                                controls
                                    className="w-[300px] h-[300px] rounded-lg object-cover cursor-pointer"
                                    onClick={() => setZoomMedia({ url: mediaUrlString!, type: 'video' })}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                              >
                                Trình duyệt của bạn không hỗ trợ video.
                              </video>
                            ) : (
                              <img
                                src={mediaUrlString}
                                alt=""
                                    className="w-[300px] h-[300px] rounded-lg object-cover cursor-pointer"
                                    onClick={() => setZoomMedia({ url: mediaUrlString!, type: 'image' })}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                              />
                            )}
                            {/* Show timestamp and read status if no text */}
                            {(!message.content || !message.content.trim()) && (
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-xs ${
                                    message.role === 'user' ? 'text-blue-600' : 'text-gray-400'
                                  }`}
                                >
                                  {message.timestamp.toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {message.role === 'user' && (
                                  <span className="text-xs text-blue-600">
                                    {message.read ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  // Text message only - with background bubble
                  <div className="max-w-[75%] min-w-0 space-y-2">
                    {/* Show product info if attached (for user messages) */}
                    {message.role === 'user' && message.productInfo && (
                      <div className="bg-white rounded-lg border border-blue-200 p-2 flex items-center gap-2 shadow-sm">
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {message.productInfo.productImage ? (
                            <img
                              src={message.productInfo.productImage}
                              alt={message.productInfo.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder-product.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-lg text-gray-400">🎧</span>
                            </div>
                          )}
                        </div>
                        {/* Product Name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 line-clamp-1">
                            {message.productInfo.productName}
                          </p>
                          <p className="text-xs text-gray-500">Đã đính kèm sản phẩm</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                          : message.type === 'none'
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-tl-none'
                          : message.type === 'advice'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200 rounded-tl-none'
                          : 'bg-white text-gray-800 rounded-tl-none shadow-md border border-gray-100'
                      }`}
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {message.content}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`text-xs ${
                            message.role === 'user' 
                              ? 'text-blue-100' 
                              : message.type === 'none'
                              ? 'text-yellow-600'
                              : message.type === 'advice'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {message.role === 'user' && (
                          <span className="text-xs text-blue-100">
                            {message.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
                  );
                })
              )}

            {/* Loading Indicator */}
              {isLoading && chatMode !== 'list' && (
              <div className="flex gap-3">
                <div className="bg-white text-gray-800 rounded-2xl shadow-md border border-gray-100 px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
            {(chatMode === 'ai' || (chatMode === 'list' && selectedStore)) && (
              <div className="border-t border-gray-200 bg-white">
            {/* Preview area - Product for AI Agent */}
            {chatMode === 'ai' && aiType === 'agent' && selectedProductForAdvise && (
              <div className="p-3 border-b border-gray-200 bg-orange-50">
                <div className="flex items-center gap-3">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {selectedProductForAdvise.productImage ? (
                      <img
                        src={selectedProductForAdvise.productImage}
                        alt={selectedProductForAdvise.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder-product.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-2xl text-gray-400">🎧</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                      {selectedProductForAdvise.productName}
                    </h4>
                    <p className="text-xs text-orange-600 font-medium">
                      Đã đính kèm - sẽ hỏi về sản phẩm này
                    </p>
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={handleRemoveProduct}
                    className="flex-shrink-0 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Xóa sản phẩm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Preview area - Files for Store Chat */}
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
                      // Open file picker that allows both image and video
                      mediaInputRef.current?.click();
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
                accept="video/*"
                multiple
                onChange={(e) => handleFileSelect(e, 'video')}
                className="hidden"
                disabled={isUploading || isLoading || chatMode === 'ai'}
              />
              {/* Input for selecting both image and video */}
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/mp4"
                multiple
                onChange={handleMediaSelect}
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
                disabled={
                  (chatMode === 'ai' && aiType === 'agent' 
                    ? (!inputMessage.trim() && !selectedProductForAdvise)
                    : (!inputMessage.trim() && selectedFiles.length === 0)
                  ) || (chatMode === 'ai' && isLoading) || isUploading
                }
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom Modal for Images and Videos */}
      {zoomMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomMedia(null)}
        >
          <button
            onClick={() => setZoomMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          {zoomMedia.type === 'video' ? (
            <video
              src={zoomMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          ) : (
            <img
              src={zoomMedia.url}
              alt="Zoomed"
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Clear Chat Confirmation Dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={cancelClearChat}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Trash2 className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Xác nhận xóa cuộc trò chuyện
            </h3>
            
            <p className="text-sm text-gray-600 text-center mb-6">
              Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện? Hành động này không thể hoàn tác.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={cancelClearChat}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmClearChat}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-colors shadow-md"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
