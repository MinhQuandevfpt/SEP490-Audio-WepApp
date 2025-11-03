import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import vietnamBanks from '../../../data/vietnamBanks';
import type { Bank } from '../../../data/vietnamBanks';

interface BankSelectorProps {
  value: string;
  onChange: (bankCode: string, bankName: string) => void;
  error?: string;
  onBlur?: () => void;
}

const BankSelector: React.FC<BankSelectorProps> = ({ value, onChange, error, onBlur }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedBank = vietnamBanks.find(bank => bank.shortName === value);

  const filteredBanks = vietnamBanks.filter(bank =>
    bank.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (bank: Bank) => {
    onChange(bank.code, bank.shortName);
    setIsOpen(false);
    setSearchTerm('');
    if (onBlur) onBlur();
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Bank Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${!selectedBank ? 'text-gray-400' : 'text-gray-900'} bg-white hover:bg-gray-50 transition-colors`}
      >
        <div className="flex items-center gap-3 flex-1">
          {selectedBank ? (
            <>
              <img
                src={selectedBank.logo}
                alt={selectedBank.shortName}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="text-left">
                <div className="font-medium">{selectedBank.shortName}</div>
                <div className="text-xs text-gray-500">{selectedBank.name}</div>
              </div>
            </>
          ) : (
            <span>Chọn ngân hàng</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm ngân hàng..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Bank List */}
          <div className="overflow-y-auto max-h-80">
            {filteredBanks.length > 0 ? (
              filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleSelect(bank)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left ${
                    selectedBank?.id === bank.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <img
                    src={bank.logo}
                    alt={bank.shortName}
                    className="w-10 h-10 object-contain flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23f3f4f6" width="40" height="40" rx="4"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3E%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{bank.shortName}</div>
                    <div className="text-xs text-gray-500 truncate">{bank.name}</div>
                  </div>
                  {selectedBank?.id === bank.id && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>Không tìm thấy ngân hàng</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankSelector;
