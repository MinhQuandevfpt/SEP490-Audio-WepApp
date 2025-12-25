import React, { useState } from 'react';
import { Modal } from 'antd';
import { CreditCard, Plus, Trash2, Edit, Check, Shield, Eye, EyeOff } from 'lucide-react';

interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  isDefault: boolean;
  isVerified: boolean;
  cardType: 'debit' | 'credit';
}

interface BankConnectProps {
  bankCards: BankCard[];
  onAddCard?: (card: Omit<BankCard, 'id'>) => void;
  onEditCard?: (id: string, card: Omit<BankCard, 'id'>) => void;
  onDeleteCard?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

const BankConnect: React.FC<BankConnectProps> = ({
  bankCards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onSetDefault
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [showCardNumbers, setShowCardNumbers] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    bankName: '',
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cardType: 'debit' as 'debit' | 'credit',
    isDefault: false
  });

  const formatCardNumber = (cardNumber: string, showFull: boolean = false) => {
    if (showFull) return cardNumber;
    return cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 **** **** $4');
  };

  const getCardTypeIcon = (cardType: 'debit' | 'credit') => {
    return cardType === 'credit' ? '💳' : '🏦';
  };


  const toggleCardNumberVisibility = (cardId: string) => {
    setShowCardNumbers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleAddCard = () => {
    if (onAddCard && formData.bankName && formData.cardNumber && formData.cardHolderName && formData.expiryDate) {
      onAddCard({
        ...formData,
        isVerified: false
      });
      setFormData({
        bankName: '',
        cardNumber: '',
        cardHolderName: '',
        expiryDate: '',
        cardType: 'debit',
        isDefault: false
      });
      setShowAddForm(false);
    }
  };

  const handleEditCard = (card: BankCard) => {
    setFormData({
      bankName: card.bankName,
      cardNumber: card.cardNumber,
      cardHolderName: card.cardHolderName,
      expiryDate: card.expiryDate,
      cardType: card.cardType,
      isDefault: card.isDefault
    });
    setEditingCard(card.id);
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (onEditCard && editingCard && formData.bankName && formData.cardNumber && formData.cardHolderName && formData.expiryDate) {
      onEditCard(editingCard, {
        ...formData,
        isVerified: false
      });
      setEditingCard(null);
      setFormData({
        bankName: '',
        cardNumber: '',
        cardHolderName: '',
        expiryDate: '',
        cardType: 'debit',
        isDefault: false
      });
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCard(null);
    setFormData({
      bankName: '',
      cardNumber: '',
      cardHolderName: '',
      expiryDate: '',
      cardType: 'debit',
      isDefault: false
    });
  };

  const handleDeleteCard = (id: string) => {
    if (onDeleteCard) {
      Modal.confirm({
        title: 'Xác nhận xóa thẻ ngân hàng',
        content: 'Bạn có chắc chắn muốn xóa thẻ ngân hàng này?',
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        onOk: () => {
          onDeleteCard(id);
        },
      });
    }
  };

  const handleSetDefault = (id: string) => {
    if (onSetDefault) {
      onSetDefault(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Thẻ ngân hàng</h2>
            <p className="text-sm text-gray-500">Quản lý thẻ thanh toán của bạn</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm thẻ mới
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingCard) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCard ? 'Chỉnh sửa thẻ ngân hàng' : 'Thêm thẻ ngân hàng mới'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên ngân hàng *
              </label>
              <select
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn ngân hàng</option>
                <option value="Vietcombank">Vietcombank</option>
                <option value="BIDV">BIDV</option>
                <option value="Agribank">Agribank</option>
                <option value="Techcombank">Techcombank</option>
                <option value="ACB">ACB</option>
                <option value="TPBank">TPBank</option>
                <option value="MB Bank">MB Bank</option>
                <option value="VPBank">VPBank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại thẻ *
              </label>
              <select
                value={formData.cardType}
                onChange={(e) => setFormData({ ...formData, cardType: e.target.value as 'debit' | 'credit' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="debit">Thẻ ghi nợ (Debit)</option>
                <option value="credit">Thẻ tín dụng (Credit)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số thẻ *
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setFormData({ ...formData, cardNumber: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234 5678 9012 3456"
                maxLength={16}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chủ thẻ *
              </label>
              <input
                type="text"
                value={formData.cardHolderName}
                onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="NGUYEN VAN A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày hết hạn *
              </label>
              <input
                type="text"
                value={formData.expiryDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (value.length >= 2) {
                    setFormData({ ...formData, expiryDate: value.slice(0, 2) + '/' + value.slice(2) });
                  } else {
                    setFormData({ ...formData, expiryDate: value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Đặt làm thẻ mặc định</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={editingCard ? handleSaveEdit : handleAddCard}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              {editingCard ? 'Lưu thay đổi' : 'Thêm thẻ'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Bank Cards List */}
      {bankCards.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Chưa có thẻ ngân hàng nào</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Thêm thẻ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankCards.map((card) => (
            <div 
              key={card.id} 
              className={`relative rounded-lg p-4 transition-all ${
                card.isDefault 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200' 
                  : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCardTypeIcon(card.cardType)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{card.bankName}</h4>
                    <p className="text-xs text-gray-500 capitalize">{card.cardType} Card</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {card.isVerified && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  )}
                  {card.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Mặc định
                    </span>
                  )}
                </div>
              </div>

              {/* Card Number */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-semibold text-gray-800">
                    {formatCardNumber(card.cardNumber, showCardNumbers[card.id])}
                  </span>
                  <button
                    onClick={() => toggleCardNumberVisibility(card.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showCardNumbers[card.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Details */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>{card.cardHolderName}</span>
                <span>{card.expiryDate}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCard(card)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                >
                  <Edit className="w-3 h-3" />
                  Sửa
                </button>
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                  >
                    <Check className="w-3 h-3" />
                    Mặc định
                  </button>
                )}
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Bảo mật thông tin</h4>
            <p className="text-sm text-blue-700">
              Thông tin thẻ ngân hàng của bạn được mã hóa và bảo mật theo tiêu chuẩn PCI DSS. 
              Chúng tôi không lưu trữ thông tin CVV/CVC của thẻ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankConnect;
