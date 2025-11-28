import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search, Loader2, MessageCircle } from 'lucide-react';
import { SellerChatService, type ChatMessage } from '../../../services/seller/ChatService';
import HttpInterceptor from '../../../services/HttpInterceptor';
import FirebaseRealtimeChatService from '../../../services/FirebaseRealtimeChatService';

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
  const [storeId, setStoreId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Subscribe to Firebase realtime updates
    const unsubscribe = FirebaseRealtimeChatService.subscribeToMessages(
      selectedConversation.customerId,
      storeId,
      (firebaseMessages) => {
        setIsLoading(false);
        
        // Convert Firebase messages to ChatMessage format
        const formattedMessages: ChatMessage[] = firebaseMessages.map((msg) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderType: msg.senderType,
          content: msg.content,
          messageType: msg.messageType || 'TEXT',
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : new Date(msg.createdAt).toISOString(),
        }));
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
    if (!inputMessage.trim() || !selectedConversation || !storeId || isSending) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');

    try {
      setIsSending(true);
      // Send message to both API and Firebase
      await Promise.all([
        // Send to API (for backend storage)
        SellerChatService.sendMessage(
          selectedConversation.customerId,
          storeId,
          {
            senderId: storeId,
            senderType: 'STORE',
            content: messageContent,
            messageType: 'TEXT',
          }
        ),
        // Send to Firebase (for realtime sync)
        FirebaseRealtimeChatService.sendMessage(
          selectedConversation.customerId,
          storeId,
          {
            senderId: storeId,
            senderType: 'STORE',
            content: messageContent,
            messageType: 'TEXT',
          }
        )
      ]);
      // Message will be updated automatically via Firebase listener
    } catch (error) {
      console.error('Error sending message:', error);
      setInputMessage(messageContent);
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
                      {message.mediaUrl && (
                        <img
                          src={message.mediaUrl}
                          alt="attachment"
                          className="mt-2 rounded-lg max-w-full"
                        />
                      )}
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
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isSending}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  {isSending ? (
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

