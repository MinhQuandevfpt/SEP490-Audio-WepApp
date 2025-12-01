import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Send, User, Search, Loader2, MessageCircle, Image, Video, X } from 'lucide-react';
import { SellerChatService, type ChatMessage } from '../../../services/seller/ChatService';
import HttpInterceptor from '../../../services/HttpInterceptor';
import FirestoreChatService from '../../../services/FirestoreChatService';
import FileUploadService from '../../../services/FileUploadService';

interface Conversation {
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: Date;
  storeUnreadCount?: number;
  customerUnreadCount?: number;
  unreadCount?: number; // For backward compatibility
  lastMessageSenderType?: 'CUSTOMER' | 'STORE'; // Track who sent the last message
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
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string; type: 'image' | 'video' }>>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomMedia, setZoomMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null); // For selecting both image and video
  const selectedConversationIdRef = useRef<string | null>(null); // Track selected conversation ID
  
  // Cache for customer names to avoid repeated API calls
  const customerNameCache = useRef<Map<string, string>>(new Map());
  
  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadStoreId = async () => {
    try {
      const id = await SellerChatService.getStoreId();
      setStoreId(id);
    } catch (error) {
      // Silent fail
    }
  };

  // Fetch customer name from API with caching
  const fetchCustomerName = useCallback(async (customerId: string): Promise<string> => {
    // Check cache first
    if (customerNameCache.current.has(customerId)) {
      return customerNameCache.current.get(customerId)!;
    }
    
    try {
      const response = await HttpInterceptor.get<CustomerInfo>(
        `/api/customers/${customerId}`,
        { userType: 'seller' }
      );
      const name = response.fullName || `Customer ${customerId.substring(0, 8)}...`;
      // Cache the result
      customerNameCache.current.set(customerId, name);
      return name;
    } catch (error) {
      const fallbackName = `Customer ${customerId.substring(0, 8)}...`;
      // Cache fallback to avoid repeated failed requests
      customerNameCache.current.set(customerId, fallbackName);
      return fallbackName;
    }
  }, []);

  const loadConversations = useCallback(async () => {
    if (!storeId) {
      console.log('⚠️ No storeId, skipping loadConversations');
      return;
    }

    try {
      console.log('📥 Loading conversations for storeId:', storeId);
      const conversationsList = await SellerChatService.getConversations(storeId);
      console.log('📨 Conversations response:', conversationsList);
      
      // Fetch customer names and last messages in parallel (with caching)
      const conversationsWithNames = await Promise.all(
        conversationsList.map(async (conv) => {
          const customerName = await fetchCustomerName(conv.customerId);
          
          // Get last message to format it properly
          let formattedLastMessage = conv.lastMessage || '';
          try {
            // Fetch last message to get full message data for formatting
            const messagesResponse = await SellerChatService.getMessages(conv.customerId, storeId, 1);
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
            customerId: conv.customerId,
            customerName,
            lastMessage: formattedLastMessage,
            lastMessageTime: new Date(conv.lastMessageTime),
            storeUnreadCount: conv.storeUnreadCount || 0,
            customerUnreadCount: conv.customerUnreadCount || 0,
            unreadCount: conv.storeUnreadCount || 0, // For backward compatibility
            lastMessageSenderType: undefined, // Will be updated by Firebase listener
          };
        })
      );

      // Preserve unreadCount = 0 for selected conversation
      const selectedCustomerId = selectedConversationIdRef.current;
      const conversationsWithPreservedUnread = conversationsWithNames.map((conv) => {
        // If this conversation is currently selected, always set unreadCount = 0
        if (conv.customerId === selectedCustomerId) {
          return {
            ...conv,
            storeUnreadCount: 0,
            unreadCount: 0,
          };
        }
        return conv;
      });
      
      setConversations(conversationsWithPreservedUnread);
      
      // Auto-select first conversation if exists (use functional update to avoid dependency)
      setSelectedConversation((prev) => {
        if (!prev && conversationsWithPreservedUnread.length > 0) {
          return conversationsWithPreservedUnread[0];
      }
        return prev;
      });
    } catch (error) {
      setConversations([]);
    }
  }, [storeId, fetchCustomerName, formatLastMessage]);

  useEffect(() => {
    loadStoreId();
  }, []);

  useEffect(() => {
    if (storeId) {
      loadConversations();
    }
  }, [storeId, loadConversations]);

  // Setup Firebase listeners for all conversations to update lastMessage in realtime
  useEffect(() => {
    if (!storeId || conversations.length === 0) {
      return;
    }

    // Setup Firebase listener for each conversation
    const unsubscribes: Array<() => void> = [];

    conversations.forEach((conv) => {
      const unsubscribe = FirestoreChatService.subscribeToMessages(
        conv.customerId,
        storeId,
        (firebaseMessages) => {
          if (firebaseMessages.length === 0) return;

          // Get the latest message
          const latestMessage = firebaseMessages[firebaseMessages.length - 1];
          
          // Format lastMessage text
          const lastMessageText = formatLastMessage(latestMessage);
          
          // Update conversation in the list
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.customerId === conv.customerId) {
                // ALWAYS check if conversation is selected first (using ref for up-to-date value)
                const isSelected = selectedConversationIdRef.current === conv.customerId;
                
                const newLastMessageTime = typeof latestMessage.createdAt === 'string' 
                  ? latestMessage.createdAt 
                  : new Date(latestMessage.createdAt).toISOString();
                
                // Only update if the new message is more recent
                const currentTime = new Date(c.lastMessageTime).getTime();
                const newTime = new Date(newLastMessageTime).getTime();
                
                if (newTime > currentTime) {
                  // If new message is from customer and conversation is not selected, increment unreadCount
                  const isFromCustomer = latestMessage.senderType === 'CUSTOMER';
                  const shouldIncrementUnread = isFromCustomer && !isSelected;
                  
                  return {
                    ...c,
                    lastMessage: lastMessageText,
                    lastMessageTime: new Date(newLastMessageTime),
                    lastMessageSenderType: latestMessage.senderType,
                    // ALWAYS keep unreadCount = 0 if conversation is selected, regardless of message
                    storeUnreadCount: isSelected ? 0 : (shouldIncrementUnread 
                      ? (c.storeUnreadCount || 0) + 1 
                      : (c.storeUnreadCount || 0)),
                    unreadCount: isSelected ? 0 : (shouldIncrementUnread 
                      ? (c.storeUnreadCount || 0) + 1 
                      : (c.storeUnreadCount || 0)),
                  };
                } else {
                  // Even if not updating time, ALWAYS ensure unreadCount = 0 if selected
                  return {
                    ...c,
                    storeUnreadCount: isSelected ? 0 : (c.storeUnreadCount || 0),
                    unreadCount: isSelected ? 0 : (c.storeUnreadCount || 0),
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
            const selectedId = selectedConversationIdRef.current;
            return sorted.map((c) => {
              if (c.customerId === selectedId) {
                return {
                  ...c,
                  storeUnreadCount: 0,
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
    }, [storeId, conversations.map(c => c.customerId).join(','), formatLastMessage]);

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.customerId || null;
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation && storeId) {
      loadMessages(selectedConversation.customerId);
    }
  }, [selectedConversation, storeId]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle conversation selection - update unreadCount immediately
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    // Update ref FIRST to ensure Firebase listener uses correct value
    selectedConversationIdRef.current = conversation.customerId;
    
    // Update unreadCount to 0 immediately when clicking
    setConversations((prev) => 
      prev.map((conv) => 
        conv.customerId === conversation.customerId
          ? { ...conv, storeUnreadCount: 0, unreadCount: 0 }
          : conv
      )
    );
    
    // Set selected conversation
    setSelectedConversation(conversation);
  }, []);

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
        console.log('📥 Loading messages for:', { customerId: selectedConversation.customerId, storeId });
        const response = await SellerChatService.getMessages(selectedConversation.customerId, storeId, 100);
        
        console.log('📨 Messages response:', response);
        
        // Handle different response structures
        let messagesData: ChatMessage[] = [];
        
        if (Array.isArray(response)) {
          // Response is directly an array
          messagesData = response;
        } else if (response?.data) {
          // Response has data property
          if (Array.isArray(response.data)) {
            messagesData = response.data;
          } else {
            console.warn('⚠️ Response.data is not an array:', response.data);
          }
        } else {
          console.warn('⚠️ Unexpected response structure:', response);
        }
        
        console.log('✅ Parsed messages:', messagesData.length, messagesData);
        
        if (messagesData.length > 0) {
          setMessages(messagesData);
          
          // Update lastMessageSenderType from the last message
          const lastMessage = messagesData[messagesData.length - 1];
          if (lastMessage) {
            setConversations((prev) => 
              prev.map((conv) => {
                if (conv.customerId === selectedConversation.customerId) {
                  // Always ensure unreadCount = 0 for selected conversation
                  const isSelected = selectedConversationIdRef.current === conv.customerId;
                  return { 
                    ...conv, 
                    lastMessageSenderType: lastMessage.senderType,
                    storeUnreadCount: isSelected ? 0 : (conv.storeUnreadCount || 0),
                    unreadCount: isSelected ? 0 : (conv.unreadCount || 0),
                  };
                }
                return conv;
              })
            );
          }
          
          setIsLoading(false);
        } else {
          console.log('ℹ️ No messages found');
          setMessages([]);
          setIsLoading(false);
        }
        
          // Mark messages as read when opening conversation (async, doesn't block UI)
          Promise.all([
            SellerChatService.markAsRead(selectedConversation.customerId, storeId, storeId),
            // Also update read status in Firestore for messages from CUSTOMER
            FirestoreChatService.updateMessagesReadStatus(selectedConversation.customerId, storeId, 'CUSTOMER')
          ]).catch((error) => {
            console.error('❌ Error marking messages as read:', error);
          });
      } catch (error) {
        console.error('❌ Error loading messages:', error);
        setMessages([]);
        setIsLoading(false);
      }
    };

    loadInitialMessages();

    // Subscribe to Firestore realtime updates
    // Firestore now supports full mediaUrl array, so we can use it directly
    const unsubscribe = FirestoreChatService.subscribeToMessages(
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
            read: msg.read !== undefined ? msg.read : false, // Default to false if not provided
          };
          return formatted;
        });
        setMessages(formattedMessages);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedConversation?.customerId, storeId]);

  const loadMessages = async (customerId: string, showLoading = true) => {
    if (!storeId) return;

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const response = await SellerChatService.getMessages(customerId, storeId, 100);
      setMessages(response.data || []);
    } catch (error) {
      setMessages([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !storeId) return;

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
        // Send to Firestore (for realtime sync) - Firestore now supports array format
        FirestoreChatService.sendMessage(
          selectedConversation.customerId,
          storeId,
          {
            senderId: storeId,
            senderType: 'STORE',
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl, // Send full array or string as is
            read: false, // Default to false when sending
          }
        )
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
          conv.customerId === selectedConversation.customerId
            ? {
                ...conv,
                lastMessage: formatLastMessageText(),
                lastMessageTime: new Date(),
                lastMessageSenderType: 'STORE' as 'CUSTOMER' | 'STORE',
              }
            : conv
        ).sort((a, b) => {
          const timeA = new Date(a.lastMessageTime).getTime();
          const timeB = new Date(b.lastMessageTime).getTime();
          return timeB - timeA;
        })
      );
      
      // Message will be updated automatically via Firebase listener
    } catch (error: any) {
      // Restore inputs on error
      setInputMessage(messageContent);
      setSelectedFiles(filesToSend);
      
      // Show error message
      alert(error.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.');
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

    const validFiles: Array<{ file: File; type: 'image' | 'video' }> = [];
    
    // Validate and categorize all files
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        validFiles.push({ file, type: 'image' });
      } else if (file.type.startsWith('video/')) {
        // Check if it's MP4
        if (file.type.includes('video/mp4') || file.name.toLowerCase().endsWith('.mp4')) {
          const maxSize = 30 * 1024 * 1024; // 30MB
          if (file.size > maxSize) {
            alert(`Video "${file.name}" có dung lượng quá lớn (tối đa 30MB)`);
            return;
          }
          validFiles.push({ file, type: 'video' });
        } else {
          alert(`Chỉ hỗ trợ định dạng video MP4. File "${file.name}" không được hỗ trợ.`);
          return;
        }
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


  // Memoize filtered conversations to avoid recalculation on every render
  const filteredConversations = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return conversations;
    const searchLower = debouncedSearchTerm.toLowerCase();
    return conversations.filter((conv) =>
      conv.customerName.toLowerCase().includes(searchLower)
    );
  }, [conversations, debouncedSearchTerm]);

  return (
    <div className="-m-6 flex flex-col" style={{ paddingTop: '24px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px', height: 'calc(100vh - 70px)' }}>
      <div className="flex-1 flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                onClick={() => handleSelectConversation(conversation)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedConversation?.customerId === conversation.customerId
                    ? 'bg-orange-50'
                    : ''
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {conversation.customerName}
                    </h3>
                    {(conversation.storeUnreadCount || conversation.unreadCount || 0) > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 px-1.5">
                        {conversation.storeUnreadCount || conversation.unreadCount || 0}
                      </span>
                    )}
                  </div>
                  <p 
                    className={`text-xs truncate max-w-full ${
                      // If has unread count, show last message in black (assume it's from customer)
                      (conversation.storeUnreadCount || conversation.unreadCount || 0) > 0
                        ? 'text-black font-semibold' 
                        : 'text-gray-500'
                    }`} 
                    title={conversation.lastMessage}
                  >
                    {conversation.lastMessage && conversation.lastMessage.length > 50 
                      ? `${conversation.lastMessage.substring(0, 50)}...` 
                      : conversation.lastMessage}
                  </p>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 min-w-0">
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
                    className={`flex gap-3 min-w-0 ${
                      message.senderType === 'STORE' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Message Bubble */}
                    {message.mediaUrl && (message.messageType === 'IMAGE' || message.messageType === 'VIDEO' || message.messageType === 'MIXED' || (typeof message.mediaUrl === 'string' && message.mediaUrl.match(/\.(mp4|webm|ogg|jpg|jpeg|png|gif)$/i))) ? (
                      // Image/Video/MIXED with optional text
                      <div className="max-w-[300px] min-w-0 space-y-2">
                        {/* Show text bubble first if exists */}
                        {message.content && message.content.trim() && (
                    <div
                            className={`rounded-2xl px-4 py-2 min-w-0 ${
                        message.senderType === 'STORE'
                          ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200'
                      }`}
                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {message.content}
                      </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span
                                className={`text-xs ${
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
                              {message.senderType === 'STORE' && (
                                <span className="text-xs text-orange-100">
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
                              return (
                                <>
                                  {message.messageType === 'VIDEO' || message.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
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
                                  {/* Show timestamp only if no text */}
                                  {(!message.content || !message.content.trim()) && (
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`text-xs ${
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
                                      {message.senderType === 'STORE' && (
                                        <span className="text-xs text-orange-600">
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
                                {/* Show timestamp only if no text */}
                                {(!message.content || !message.content.trim()) && (
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-xs ${
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
                                    {message.senderType === 'STORE' && (
                                      <span className="text-xs text-orange-600">
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
                                {/* Show timestamp only if no text */}
                                {(!message.content || !message.content.trim()) && (
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-xs ${
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
                                    {message.senderType === 'STORE' && (
                                      <span className="text-xs text-orange-600">
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
                      <div
                        className={`max-w-[70%] min-w-0 rounded-2xl px-4 py-2 ${
                        message.senderType === 'STORE'
                          ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200'
                      }`}
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {message.content}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                      <span
                          className={`text-xs ${
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
                        {message.senderType === 'STORE' && (
                          <span className="text-xs text-orange-100">
                            {message.read ? '✓✓' : '✓'}
                          </span>
                        )}
                    </div>
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
                        // Open file picker that allows both image and video
                        mediaInputRef.current?.click();
                      }}
                      className="w-[120px] h-[120px] rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 flex items-center justify-center bg-white transition-colors"
                      title="Thêm ảnh/video"
                      disabled={isUploading}
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
                  disabled={isUploading}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'video')}
                  className="hidden"
                  disabled={isUploading}
                />
                {/* Input for selecting both image and video */}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                
                {/* Upload buttons */}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gửi ảnh"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploading}
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
                  disabled={isUploading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isUploading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Send message"
                >
                    <Send className="w-5 h-5" />
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
      </div>
    </div>
  );
};

export default MessagesPage;

