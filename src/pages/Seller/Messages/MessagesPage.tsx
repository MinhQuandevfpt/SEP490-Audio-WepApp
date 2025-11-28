import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search, Loader2, MessageCircle, Image, Video, X } from 'lucide-react';
import { SellerChatService, type ChatMessage } from '../../../services/seller/ChatService';
import HttpInterceptor from '../../../services/HttpInterceptor';
import FirebaseRealtimeChatService from '../../../services/FirebaseRealtimeChatService';
import FileUploadService from '../../../services/FileUploadService';

interface Conversation {
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface CustomerInfo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string; type: 'image' | 'video' }>>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStoreId();
  }, []);

  useEffect(() => {
    if (storeId) {
      loadConversations();
    }
  }, [storeId]);

  useEffect(() => {
    if (selectedConversation && storeId) {
      loadMessages(selectedConversation.customerId);
    }
  }, [selectedConversation, storeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages and setup Firebase listener
  useEffect(() => {
    if (!selectedConversation || !storeId) {
      return;
    }

    // Clear old messages first
    setMessages([]);
    setIsLoading(true);

    // First, load messages from API (has full mediaUrl array info)
    const loadInitialMessages = async () => {
      try {
        const response = await SellerChatService.getMessages(selectedConversation.customerId, storeId, 100);
        
        if (response.data && response.data.length > 0) {
          setMessages(response.data);
          setIsLoading(false);
        } else {
          setMessages([]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading initial messages:', error);
        setMessages([]);
        setIsLoading(false);
      }
    };

    loadInitialMessages();

    // Subscribe to Firebase realtime updates
    // Firebase now supports full mediaUrl array, so we can use it directly
    const unsubscribe = FirebaseRealtimeChatService.subscribeToMessages(
      selectedConversation.customerId,
      storeId,
      (firebaseMessages) => {
        // Convert Firebase messages to ChatMessage format
        // Firebase now supports both string and array format for mediaUrl
        const formattedMessages: ChatMessage[] = firebaseMessages.map((msg) => {
          const formatted = {
            id: msg.id,
            senderId: msg.senderId,
            senderType: msg.senderType,
            content: msg.content || '',
            messageType: (msg.messageType || 'TEXT') as 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED',
            mediaUrl: msg.mediaUrl, // Can be string or array - preserve as is
            createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : new Date(msg.createdAt).toISOString(),
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
    );

    return () => {
      unsubscribe();
    };
  }, [selectedConversation?.customerId, storeId]);

  const loadStoreId = async () => {
    try {
      const id = await SellerChatService.getStoreId();
      setStoreId(id);
    } catch (error) {
      console.error('Error loading store ID:', error);
    }
  };

  // Fetch customer name from API
  const fetchCustomerName = async (customerId: string): Promise<string> => {
    try {
      const response = await HttpInterceptor.get<CustomerInfo>(
        `/api/customers/${customerId}`,
        { userType: 'seller' }
      );
      return response.fullName || `Customer ${customerId.substring(0, 8)}...`;
    } catch (error) {
      console.warn('⚠️ Could not fetch customer name:', error);
      return `Customer ${customerId.substring(0, 8)}...`;
    }
  };

  const loadConversations = async () => {
    if (!storeId) return;

    try {
      console.log('📋 Loading conversations for store:', storeId);
      const conversationsList = await SellerChatService.getConversations(storeId);
      
      console.log('✅ Conversations loaded:', conversationsList);
      
      // Fetch customer names in parallel
      const conversationsWithNames = await Promise.all(
        conversationsList.map(async (conv) => {
          const customerName = await fetchCustomerName(conv.customerId);
          return {
            customerId: conv.customerId,
            customerName,
            lastMessage: conv.lastMessage || '',
            lastMessageTime: new Date(conv.lastMessageTime),
            unreadCount: 0,
          };
        })
      );

      setConversations(conversationsWithNames);
      
      // Auto-select first conversation if exists
      if (conversationsWithNames.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsWithNames[0]);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setConversations([]);
    }
  };

  const loadMessages = async (customerId: string, showLoading = true) => {
    if (!storeId) return;

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const response = await SellerChatService.getMessages(customerId, storeId, 100);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !storeId || isSending) return;

    // Check if there's text or files to send
    const hasText = inputMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if (!hasText && !hasFiles) return;

    const messageContent = inputMessage.trim();
    const filesToSend = [...selectedFiles];

    // Clear inputs immediately
    setInputMessage('');
    setSelectedFiles([]);

    try {
      setIsSending(true);

      let mediaUrl: string | Array<{ url: string; type: string }> | undefined;
      let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED' = 'TEXT';
      let content = messageContent;

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
          setIsSending(false);
          // Restore inputs on error
          setInputMessage(messageContent);
          setSelectedFiles(filesToSend);
          return;
          } finally {
            setIsUploading(false);
          }
      }

      // Send message to both API and Firebase
      await Promise.all([
        // Send to API (for backend storage)
        SellerChatService.sendMessage(
          selectedConversation.customerId,
          storeId,
          {
            senderId: storeId,
            senderType: 'STORE',
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl,
          }
        ),
        // Send to Firebase (for realtime sync) - Firebase now supports array format
        FirebaseRealtimeChatService.sendMessage(
          selectedConversation.customerId,
          storeId,
          {
            senderId: storeId,
            senderType: 'STORE',
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl, // Send full array or string as is
          }
        )
      ]);
      // Message will be updated automatically via Firebase listener
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore inputs on error
      setInputMessage(messageContent);
      setSelectedFiles(filesToSend);
    } finally {
      setIsSending(false);
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


  const filteredConversations = conversations.filter((conv) =>
    conv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-200px)] flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Chưa có tin nhắn nào</p>
              <p className="text-gray-400 text-xs mt-1">
                Tin nhắn từ khách hàng sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.customerId}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedConversation?.customerId === conversation.customerId
                    ? 'bg-orange-50'
                    : ''
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {conversation.customerName}
                    </h3>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                  <span className="text-xs text-gray-400 mt-1">
                    {new Date(conversation.lastMessageTime).toLocaleString('vi-VN')}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedConversation.customerName}</h2>
                  <p className="text-xs text-gray-500">Khách hàng</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Chưa có tin nhắn nào</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex gap-3 ${
                      message.senderType === 'STORE' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.senderType === 'STORE'
                          ? 'bg-gradient-to-br from-orange-500 to-red-500'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}
                    >
                      <User className="w-4 h-4 text-white" />
                    </div>

                    {/* Message Bubble */}
                    {message.mediaUrl && (message.messageType === 'IMAGE' || message.messageType === 'VIDEO' || message.messageType === 'MIXED' || (typeof message.mediaUrl === 'string' && message.mediaUrl.match(/\.(mp4|webm|ogg|jpg|jpeg|png|gif)$/i))) ? (
                      // Image/Video/MIXED with optional text
                      <div className="max-w-[300px] space-y-2">
                        {/* Handle mediaUrl as array (MIXED) or string (IMAGE/VIDEO) */}
                        {(() => {
                          const isArray = Array.isArray(message.mediaUrl);
                          const isMixed = message.messageType === 'MIXED';
                          
                          // Debug log
                          if (isMixed || isArray) {
                            console.log('🔍 MIXED message detected (Seller):', {
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
                              message.senderType === 'STORE'
                                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <span
                              className={`text-xs mt-1 block ${
                                message.senderType === 'STORE' ? 'text-orange-100' : 'text-gray-400'
                              }`}
                            >
                              {message.createdAt
                                ? new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                        )}
                        {/* Show timestamp only if no text */}
                        {(!message.content || !message.content.trim()) && (
                          <span
                            className={`text-xs block ${
                              message.senderType === 'STORE' ? 'text-orange-600' : 'text-gray-400'
                            }`}
                          >
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      // Text message only - with background bubble
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.senderType === 'STORE'
                            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <span
                          className={`text-xs mt-1 block ${
                            message.senderType === 'STORE' ? 'text-orange-100' : 'text-gray-400'
                          }`}
                        >
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
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
                        // Show options to add image or video
                        imageInputRef.current?.click();
                      }}
                      className="w-[120px] h-[120px] rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 flex items-center justify-center bg-white transition-colors"
                      title="Thêm ảnh/video"
                      disabled={isUploading || isSending}
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
                  disabled={isUploading || isSending}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'video')}
                  className="hidden"
                  disabled={isUploading || isSending}
                />
                
                {/* Upload buttons */}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading || isSending}
                  className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gửi ảnh"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploading || isSending}
                  className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gửi video"
                >
                  <Video className="w-5 h-5" />
                </button>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isSending || isUploading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isSending || isUploading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  {isSending || isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Chọn một cuộc trò chuyện</h3>
              <p className="text-sm text-gray-500">
                Chọn khách hàng từ danh sách bên trái để bắt đầu chat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;

