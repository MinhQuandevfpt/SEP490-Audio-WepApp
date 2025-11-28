import React, { useEffect, useState } from 'react';
import { MessageCircle, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomerStoreService } from '../../../services/customer/StoreService';
import { useChatContext } from '../../../contexts/ChatContext';
import { CustomerAuthService } from '../../../services/customer/Authcustomer';

interface StoreInfoProps {
  storeId: string;
  storeName: string;
  storeAvatar?: string;
}

const StoreInfo: React.FC<StoreInfoProps> = ({ storeId, storeName, storeAvatar }) => {
  const navigate = useNavigate();
  const chatContext = useChatContext();
  const [storeData, setStoreData] = useState<{
    logoUrl?: string;
    coverImageUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=ff6b35&color=fff&size=128`;
  
  // Fetch store details to get logo and cover image
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const data = await CustomerStoreService.getStoreById(storeId);
        setStoreData(data);
      } catch (error) {
        console.error('Error fetching store data:', error);
        setStoreData(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);
  
  const handleChatWithStore = () => {
    // Check if user is logged in
    if (!CustomerAuthService.isAuthenticated()) {
      // Redirect to login page
      navigate('/auth/login');
      return;
    }
    
    // Open chat with this store
    chatContext.openChat('store', storeId);
  };

  const handleVisitStore = () => {
    navigate(`/store/${storeId}`);
  };

  const handleAvatarClick = () => {
    navigate(`/store/${storeId}`);
  };

  const handleStoreNameClick = () => {
    navigate(`/store/${storeId}`);
  };

  // Use logo from API if available, otherwise use prop or default
  const displayAvatar = storeData?.logoUrl || storeAvatar || defaultAvatar;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4">
      <div className="flex items-center gap-4">
        {/* Store Avatar - Clickable */}
        <div 
          className="flex-shrink-0 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-200 hover:border-orange-400 transition-colors">
            {loading ? (
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            ) : (
              <img
                src={displayAvatar}
                alt={storeName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultAvatar;
                }}
              />
            )}
          </div>
        </div>

        {/* Store Name & Actions */}
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold text-gray-900 truncate mb-2 cursor-pointer hover:text-orange-500 transition-colors"
            onClick={handleStoreNameClick}
          >
            {storeName}
          </h3>
          
          <div className="flex gap-2">
            {/* Chat Button */}
            <button
              onClick={handleChatWithStore}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Chat</span>
            </button>

            {/* Visit Store Button */}
            <button
              onClick={handleVisitStore}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Store className="w-4 h-4" />
              <span className="text-sm font-medium">Xem gian hàng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreInfo;
