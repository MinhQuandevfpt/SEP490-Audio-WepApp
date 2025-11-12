import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { ShieldCheck, ShoppingBag, Users, DollarSign } from 'lucide-react';
import type { StoreOrder } from '../../types/seller';
import type { Warranty } from '../../types/api';
import { formatCurrency } from '../../utils/orderStatus';

interface WarrantyWithOrder extends Warranty {
  storeOrderId: string;
  orderCreatedAt: string;
  orderGrandTotal: number;
}

interface WarrantySummaryProps {
  orders: StoreOrder[];
  warranties?: WarrantyWithOrder[];
}

const WarrantySummary: React.FC<WarrantySummaryProps> = ({ orders, warranties = [] }) => {
  const totalOrders = orders.length;
  const totalWarranties = warranties.length;
  const totalItems = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const uniqueCustomers = new Set(orders.map(order => order.customerId)).size;
  const totalValue = orders.reduce((sum, order) => sum + order.grandTotal, 0);

  const summaryCards = [
    {
      title: 'Đơn đủ điều kiện',
      value: totalOrders,
      icon: ShieldCheck,
      description: 'Đơn hàng đã giao thành công',
      color: '#f97316',
    },
    {
      title: 'Bảo hành đã kích hoạt',
      value: totalWarranties,
      icon: ShieldCheck,
      description: 'Số lượng bảo hành đã được kích hoạt',
      color: '#10b981',
    },
    {
      title: 'Sản phẩm',
      value: totalItems,
      icon: ShoppingBag,
      description: 'Số lượng sản phẩm trong các đơn',
      color: '#0ea5e9',
    },
    {
      title: 'Khách hàng',
      value: uniqueCustomers,
      icon: Users,
      description: 'Khách hàng cần kích hoạt bảo hành',
      color: '#8b5cf6',
    },
    {
      title: 'Giá trị đơn hàng',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      description: 'Tổng doanh thu đã giao',
      color: '#f59e0b',
      isCurrency: true,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <Col xs={24} sm={12} lg={8} key={card.title} flex="1">
            <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 truncate">{card.title}</p>
                  <Statistic
                    value={card.value}
                    valueStyle={{
                      fontSize: card.isCurrency ? 18 : 26,
                      fontWeight: 700,
                      color: '#1f2937',
                      lineHeight: 1.2,
                    }}
                  />
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner flex-shrink-0 ml-3"
                  style={{ backgroundColor: `${card.color}1a` }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{card.description}</p>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default WarrantySummary;


