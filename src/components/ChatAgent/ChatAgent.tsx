import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIProductSearchService, { type ProductSearchResponse } from '../../services/ai/AIProductSearchService';
import { CustomerAuthService } from '../../services/customer/Authcustomer';
import { getCustomerId } from '../../utils/authHelper';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'product_search' | 'advice' | 'none';
  products?: Array<{
    effectivePrice: string;
    productId: string;
    rating: string;
    brand: string;
    name: string;
    summary: string;
  }>;
  productCount?: number;
}

const ChatAgent: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Xin chào! Tôi là Chat Agent, chuyên tư vấn về sản phẩm âm thanh. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn setup phòng nghe, và phối ghép thiết bị. Bạn cần tư vấn gì?',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = CustomerAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated && isOpen) {
        // Redirect to login if not authenticated and chat is open
        navigate('/auth/login');
        setIsOpen(false);
      }
    };
    
    checkAuth();
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen, navigate]);

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

  // Get userId from customerId (first 4 characters)
  const getUserId = (): string => {
    const customerId = getCustomerId();
    if (!customerId) {
      throw new Error('Customer ID not found. Please login.');
    }
    // Get first 4 characters of customerId
    return customerId.substring(0, 4);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check authentication
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    const messageToSend = inputMessage.trim();
    setInputMessage('');

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setIsLoading(true);

      // Get userId (first 4 chars of customerId)
      const userId = getUserId();

      // Call API
      const response: ProductSearchResponse = await AIProductSearchService.searchProducts({
        userId,
        question: messageToSend,
      });

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
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Check for quota exceeded error (429 or RESOURCE_EXHAUSTED)
      const isQuotaExceeded = 
        error?.status === 429 ||
        error?.data?.status === 'RESOURCE_EXHAUSTED' ||
        (error?.message && (
          error.message.toLowerCase().includes('quota') ||
          error.message.toLowerCase().includes('exceeded') ||
          error.message.toLowerCase().includes('resource_exhausted') ||
          error.message.toLowerCase().includes('rate limit')
        )) ||
        (error?.data?.error?.status === 'RESOURCE_EXHAUSTED') ||
        (error?.data?.error?.code === 429);
      
      let errorContent: string;
      if (isQuotaExceeded) {
        errorContent = 'Hết dung lượng hỏi AI rồi nha bạn! Hãy quay lại sau 1 thời gian nữa nha. Xin lỗi vì sự bất tiện này :(';
      } else {
        errorContent = error?.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?')) {
      setMessages([{
        id: '0',
        role: 'assistant',
        content: 'Xin chào! Tôi là Chat Agent, chuyên tư vấn về sản phẩm âm thanh. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn setup phòng nghe, và phối ghép thiết bị. Bạn cần tư vấn gì?',
        timestamp: new Date(),
        type: 'text',
      }]);
    }
  };

  const handleOpenChat = () => {
    // Check authentication first
    if (!CustomerAuthService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }
    setIsOpen(true);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-32 z-50">
          <button
            onClick={handleOpenChat}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 group flex flex-col items-center gap-1.5 px-4 py-3 w-20"
            aria-label="Open Chat Agent"
          >
            <Bot className="w-7 h-7 group-hover:animate-pulse" />
            <span className="text-xs font-medium whitespace-nowrap">Chat Agent</span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[500px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-[60] border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Chat Agent</h3>
                  <p className="text-xs text-white/80">Tư vấn sản phẩm âm thanh</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-w-0">
            {messages.map((message) => (
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
                          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleProductClick(product.productId)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900 truncate">
                                  {product.name}
                                </span>
                                <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                                  {product.brand}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {product.summary}
                              </p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-semibold text-purple-600">
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
                ) : (
                  // Text message (advice, none, or regular text)
                  <div
                    className={`max-w-[75%] min-w-0 rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-tr-none'
                        : message.type === 'none'
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-tl-none'
                        : message.type === 'advice'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 rounded-tl-none'
                        : 'bg-white text-gray-800 rounded-tl-none shadow-md border border-gray-100'
                    }`}
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`text-xs ${
                          message.role === 'user'
                            ? 'text-purple-100'
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
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-white text-gray-800 rounded-2xl shadow-md border border-gray-100 px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                disabled={isLoading || !isAuthenticated}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || !isAuthenticated}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Vui lòng đăng nhập để sử dụng Chat Agent
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAgent;

