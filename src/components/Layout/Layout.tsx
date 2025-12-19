import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import AIChatbot from '../AIChatbot';
import ChatAgent from '../ChatAgent/ChatAgent';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      {/* AI Chatbot - Always available */}
      <AIChatbot />
      
      {/* Chat Agent - Product search and advice */}
      <ChatAgent />
    </div>
  );
};

export default Layout;