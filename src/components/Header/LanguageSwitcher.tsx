import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-1 text-gray-600 hover:text-orange-500 transition-colors px-1 sm:px-2 py-1 rounded-md hover:bg-gray-50"
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline text-sm font-medium uppercase">{language === 'vi' ? 'VN' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;
