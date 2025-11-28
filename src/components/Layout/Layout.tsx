import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import AIChatbot from '../AIChatbot';
import { ChatProvider } from '../../contexts/ChatContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ChatProvider>
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      {/* AI Chatbot - Always available */}
      <AIChatbot />
    </div>
    </ChatProvider>
  );
};

export default Layout;