import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CustomerOrder } from '../../types/api';
import { getStatusBadgeClass, getStatusLabel, formatCurrency, formatDate } from '../../utils/orderStatus';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { Space, Typography, Divider, Tag, Card } from 'antd';

const { Text } = Typography;

interface Props {
  order: CustomerOrder;
  onViewDetail?: (orderId: string) => void;
}

const OrderCard: React.FC<Props> = ({ order, onViewDetail }) => {
  const navigate = useNavigate();
  const totalItems = order.storeOrders.reduce((sum, so) => sum + so.items.reduce((s, item) => s + item.quantity, 0), 0);
  const displayOrderCode = order.orderCode ?? ' - ';
  
  // Get first product for display
  const firstProduct = order.storeOrders
    .flatMap(so => so.items)
    .find(item => item) || null;

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(order.id);
    } else {
      navigate('/orders', { state: { orderId: order.id } });
    }
  };

  return (
    <Card
      className="order-card"
      hoverable
      styles={{
        body: { padding: '20px' }
      }}
      style={{
        borderRadius: 16,
        border: 'none',
        boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(255,107,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{
            background: '#FFF0E1',
            borderRadius: 12,
            padding: '12px 16px'
          }}
        >
          <Space size="small">
            <Package className="w-4 h-4 text-orange-500" />
            <Text className="text-sm font-medium text-gray-700">
              Mã đơn:
            </Text>
            <Text code className="text-sm font-semibold text-gray-900">
              {displayOrderCode}
            </Text>
          </Space>
          <Tag
            className={`${getStatusBadgeClass(order.status)} shadow-sm`}
            style={{
              margin: 0,
              borderRadius: 12,
              background: '#FFE7D4',
              color: '#FF6B00',
              border: 'none',
              padding: '4px 12px',
              fontWeight: 600,
              fontSize: 12
            }}
          >
            {getStatusLabel(order.status)}
          </Tag>
        </div>

        {/* Product Info with Date */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-orange-100 bg-orange-50/40">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {firstProduct?.image ? (
              <img 
                src={firstProduct.image} 
                alt={firstProduct.name}
                className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            {firstProduct ? (
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                {firstProduct.name}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Không có sản phẩm</p>
            )}
            {totalItems > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                và {totalItems - 1} sản phẩm khác
              </p>
            )}
          </div>
        </div>

        <Divider style={{ margin: '4px 0 0', borderColor: '#FFE0C7' }} />

        {/* Footer */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
              Tổng tiền
            </p>
            <div className="flex items-center gap-2 text-2xl font-bold text-[#FF6B00]">
              <DollarSign className="w-5 h-5" />
              {formatCurrency(order.grandTotal)}
            </div>
          </div>
          <button
            onClick={handleViewDetail}
            className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors"
            style={{ textDecorationColor: '#9CA3AF' }}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </Card>
  );
};

export default OrderCard;