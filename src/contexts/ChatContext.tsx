import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ChatContextType {
  isOpen: boolean;
  storeId: string | null;
  openChat: (mode: 'ai' | 'store', storeId?: string) => void;
  closeChat: () => void;
  setStoreId: (id: string | null) => void;
  chatMode: 'ai' | 'store';
  productIdForAdvise: string | null; // Product ID to advise AI agent about
  setProductIdForAdvise: (productId: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [storeId, setStoreIdState] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'ai' | 'store'>('ai');
  const [productIdForAdvise, setProductIdForAdviseState] = useState<string | null>(null);

  const openChat = (mode: 'ai' | 'store', storeIdParam?: string) => {
    setChatMode(mode);
    if (storeIdParam) {
      setStoreIdState(storeIdParam);
    }
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const setStoreId = (id: string | null) => {
    setStoreIdState(id);
  };

  const setProductIdForAdvise = (productId: string | null) => {
    setProductIdForAdviseState(productId);
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        storeId,
        openChat,
        closeChat,
        setStoreId,
        chatMode,
        productIdForAdvise,
        setProductIdForAdvise,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

