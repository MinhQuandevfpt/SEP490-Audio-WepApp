import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* AudioShop Info */}
          <div className="space-y-4">
            <div>
              <span className="text-2xl font-bold">
                <span className="text-orange-500">Audio</span>
                <span className="text-blue-600">Shop</span>
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Hỗ Trợ Khách Hàng */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">{t('footer.customerSupport')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/policies" className="text-gray-600 hover:text-orange-500 text-sm">
                  {t('footer.shoppingGuide')}
                </Link>
              </li>
              <li>
                <Link to="/policies" className="text-gray-600 hover:text-orange-500 text-sm">
                  {t('footer.returnPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/policies" className="text-gray-600 hover:text-orange-500 text-sm">
                  {t('footer.payment')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Về AudioShop */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">{t('footer.aboutUs')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/policies" className="text-gray-600 hover:text-orange-500 text-sm">
                  {t('footer.introduction')}
                </Link>
              </li>
              <li>
                <Link to="/policies" className="text-gray-600 hover:text-orange-500 text-sm">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/policies" className="text-gray-600 hover:text-orange-500 text-sm">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Liên Hệ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 text-sm">
                  {t('footer.address')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="text-gray-600 text-sm">1900 1234</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="text-gray-600 text-sm">support@audioshop.vn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-300 mt-8 pt-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;