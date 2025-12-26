import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startTransition } from 'react';
import { 
  Card, 
  Select, 
  Pagination, 
  Empty, 
  Spin, 
  Space, 
  Typography, 
  Breadcrumb,
  Row,
  Col,
  Statistic
} from 'antd';
import { Home, ShoppingBag, DollarSign, FileText } from 'lucide-react';
import Layout from '../../../components/Layout';
import { OrderCard, OrderDetailModal, OrderStatusTabs } from '../../../components/OrderHistoryComponents';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder, OrderStatus } from '../../../types/api';
import { formatCurrency } from '../../../utils/orderStatus';

const { Option } = Select;
const { Title, Text } = Typography;

const OrderHistoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [ghnOrderData, setGhnOrderData] = useState<Record<string, any>>({});
  
  // Refs
  const ghnOrderDataRef = useRef<Record<string, any>>({});
  const ordersRef = useRef<CustomerOrder[]>([]);
  const isTabVisibleRef = useRef(true);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debounce helper chỉ dùng cho polling (background updates)
  const debouncedSetOrders = useCallback((newOrders: CustomerOrder[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        setOrders(newOrders);
        ordersRef.current = newOrders;
      });
    }, 300);
  }, []);

  // Load orders function - immediate update cho user actions, debounced cho polling
  const load = useCallback(async (silent: boolean = false, overrideParams?: { status?: OrderStatus | 'ALL'; search?: string; page?: number; pageSize?: number }) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
        // Optimistic update: clear orders ngay để UI responsive
        setOrders([]);
      }
      
      // Sử dụng overrideParams nếu có, nếu không dùng từ state
      const currentStatus = overrideParams?.status ?? status;
      const currentSearch = overrideParams?.search ?? search;
      const currentPage = overrideParams?.page ?? page;
      const currentPageSize = overrideParams?.pageSize ?? pageSize;
      
      // Backend uses 0-based indexing
      const backendPage = currentPage - 1;
      
      // Call service trực tiếp - không qua debounce
      const res = await OrderHistoryService.list({
        status: currentStatus === 'ALL' ? undefined : currentStatus,
        search: currentSearch || undefined,
        page: backendPage,
        size: currentPageSize,
      });
      
      // Update ngay lập tức cho user actions, debounced cho polling
      ordersRef.current = res.data;
      if (silent) {
        // Polling: dùng debounce để batch updates
        startTransition(() => {
          debouncedSetOrders(res.data);
          setTotal(prev => prev !== res.total ? res.total : prev);
          setTotalPages(prev => prev !== res.totalPages ? res.totalPages : prev);
        });
      } else {
        // User action: update ngay lập tức không debounce
        startTransition(() => {
          setOrders(res.data);
          ordersRef.current = res.data;
          setTotal(res.total);
          setTotalPages(res.totalPages);
        });
      }
      
      // Restart polling với interval mới dựa trên order status
      if (silent) {
        startPolling();
      }

      // Load GHN order data for each storeOrder tuần tự để tránh lag UI
      const ghnDataTasks: Array<{ storeOrderId: string }> = [];
      res.data.forEach((order) => {
        if (!Array.isArray(order.storeOrders)) {
          return;
        }
        order.storeOrders.forEach((storeOrder) => {
          if (!storeOrder.id || storeOrder.id.includes('-store-')) {
            return;
          }
          if (silent || !ghnOrderDataRef.current[storeOrder.id]) {
            ghnDataTasks.push({ storeOrderId: storeOrder.id });
          }
        });
      });

      // Load GHN data tuần tự với delay giữa mỗi call và batch updates
      if (ghnDataTasks.length > 0) {
        (async () => {
          const ghnUpdates: Record<string, any> = {};
          let updateCount = 0;
          const BATCH_SIZE = 3;
          
          for (const task of ghnDataTasks) {
            try {
              const ghnOrder = await OrderHistoryService.getGhnOrderByStoreOrderId(task.storeOrderId);
              if (ghnOrder && ghnOrder.data) {
                ghnUpdates[task.storeOrderId] = ghnOrder.data;
                updateCount++;
                
                if (updateCount >= BATCH_SIZE || ghnDataTasks.indexOf(task) === ghnDataTasks.length - 1) {
                  const updatesToApply = { ...ghnUpdates };
                  Object.assign(ghnOrderDataRef.current, updatesToApply);
                  startTransition(() => {
                    setGhnOrderData((prev) => ({
                      ...prev,
                      ...updatesToApply,
                    }));
                  });
                  Object.keys(ghnUpdates).forEach(key => delete ghnUpdates[key]);
                  updateCount = 0;
                }
              }
              if (ghnDataTasks.indexOf(task) < ghnDataTasks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 400));
              }
            } catch (err: any) {
              if (err?.status !== 404 && err?.status !== 500) {
                console.error(`Unexpected error loading GHN order for ${task.storeOrderId}:`, err);
              }
              if (ghnDataTasks.indexOf(task) < ghnDataTasks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 400));
              }
            }
          }
        })().catch(() => {
          // Silently fail
        });
      }
    } catch (e: any) {
      if (!silent) {
        setError(e?.message || 'Không thể tải danh sách đơn hàng');
        setOrders([]);
        setTotal(0);
        setTotalPages(0);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [status, search, page, pageSize, debouncedSetOrders]);

  // Smart polling function
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (!isTabVisibleRef.current) {
      return;
    }

    const hasActiveOrders = ordersRef.current.some(
      order => 
        order.status !== 'COMPLETED' && 
        order.status !== 'CANCELLED' &&
        order.status !== 'RETURNED'
    );

    const interval = hasActiveOrders ? 10000 : 30000;

    pollingIntervalRef.current = setInterval(() => {
      if (!isTabVisibleRef.current) {
        return;
      }
      load(true); // Silent refresh
    }, interval);
  }, [load]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (!document.hidden) {
        load(true);
        startPolling();
      } else {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [load, startPolling]);

  // Initial load khi mount
  useEffect(() => {
    let mounted = true;
    
    const initialLoad = async () => {
      await load(false);
      if (mounted) {
        startPolling();
      }
    };
    
    initialLoad();

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []); // Chỉ chạy 1 lần khi mount

  // Update ordersRef khi orders thay đổi
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Reset to page 1 when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // View detail function
  const viewDetail = async (orderId: string) => {
    try {
      const detail = await OrderHistoryService.getById(orderId);
      setSelectedOrder(detail);
    } catch (error: any) {
      console.error('Error loading order detail:', error);
    }
  };


  // Auto-open order detail modal if orderId is passed via navigation state
  useEffect(() => {
    const state = location.state as { orderId?: string } | null;
    if (state?.orderId) {
      viewDetail(state.orderId);
      // Clear the state to avoid reopening on navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, viewDetail, navigate]);

  // Calculate statistics
  const totalAmount = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
  const totalItems = orders.reduce((sum, order) => {
    if (!order.storeOrders || !Array.isArray(order.storeOrders)) {
      return sum;
    }
    const orderItems = order.storeOrders.reduce((s, so) => {
      if (!so.items || !Array.isArray(so.items)) {
        return s;
      }
      return s + so.items.reduce((i, item) => i + (item.quantity || 0), 0);
    }, 0);
    return sum + orderItems;
  }, 0);

  return (
    <Layout>
      <style>{`
        .custom-pagination-simple .ant-pagination-item {
          border-radius: 6px;
          border-color: #e5e7eb;
          min-width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .custom-pagination-simple .ant-pagination-item:hover {
          border-color: #FF6A00;
        }
        .custom-pagination-simple .ant-pagination-item-active {
          background: #FF6A00;
          border-color: #FF6A00;
        }
        .custom-pagination-simple .ant-pagination-item-active a {
          color: white;
        }
        .custom-pagination-simple .ant-pagination-prev,
        .custom-pagination-simple .ant-pagination-next {
          border-radius: 6px;
          border-color: #e5e7eb;
          min-width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .custom-pagination-simple .ant-pagination-prev:hover,
        .custom-pagination-simple .ant-pagination-next:hover {
          border-color: #FF6A00;
          color: #FF6A00;
        }
        .custom-pagination-simple .ant-pagination-jump-prev,
        .custom-pagination-simple .ant-pagination-jump-next {
          border-radius: 6px;
        }
      `}</style>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            className="mb-6"
            items={[
              { 
                title: (
                  <Space>
                    <Home className="w-4 h-4" />
                    <span>Tài khoản</span>
                  </Space>
                )
              },
              { title: 'Đơn hàng của tôi' },
            ]}
            style={{ fontSize: '14px' }}
          />

          <div className="space-y-6">
            {/* Header */}
            <div>
              <Title level={2} className="!mb-2 !text-gray-900">Đơn hàng của tôi</Title>
              <Text type="secondary" className="text-base">
                Quản lý và theo dõi tất cả đơn hàng của bạn
              </Text>
            </div>

            {/* Statistics Cards - Shopee Style */}
            {!isLoading && orders.length > 0 && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card 
                    className="border-gray-200 shadow-sm"
                    style={{
                      borderRadius: 12,
                      borderTop: '3px solid #FF6A00',
                    }}
                  >
                    <Statistic
                      title={<><FileText className="w-4 h-4 inline mr-1" />Tổng đơn hàng</>}
                      value={total || 0}
                      valueStyle={{ color: '#FF6A00', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card 
                    className="border-gray-200 shadow-sm"
                    style={{
                      borderRadius: 12,
                      borderTop: '3px solid #2D9CDB',
                    }}
                  >
                    <Statistic
                      title={<><ShoppingBag className="w-4 h-4 inline mr-1" />Tổng sản phẩm</>}
                      value={totalItems}
                      suffix="sản phẩm"
                      valueStyle={{ color: '#2D9CDB', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card 
                    className="border-gray-200 shadow-sm"
                    style={{
                      borderRadius: 12,
                      borderTop: '3px solid #27AE60',
                    }}
                  >
                    <Statistic
                      title={<><DollarSign className="w-4 h-4 inline mr-1" />Tổng giá trị</>}
                      value={totalAmount}
                      formatter={(value) => formatCurrency(Number(value))}
                      valueStyle={{ color: '#27AE60', fontSize: '24px', fontWeight: 700 }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* Status Tabs Section - Horizontal Tabs Style */}
            <OrderStatusTabs
              value={status}
              onChange={async (newStatus) => {
                // Update state ngay lập tức để UI responsive
                setStatus(newStatus);
                setPage(1);
                // Call service trực tiếp - không đợi state update
                await load(false, { status: newStatus, page: 1, pageSize });
              }}
              search={search}
              onSearchChange={(newSearch) => {
                // Update state ngay lập tức để UI responsive
                setSearch(newSearch);
                setPage(1);
                
                // Debounce search để tránh spam API khi user đang gõ
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                
                searchTimeoutRef.current = setTimeout(async () => {
                  // Call service sau khi user ngừng gõ 500ms
                  await load(false, { search: newSearch, page: 1, pageSize });
                }, 500);
              }}
            />

            {/* Orders List */}
            {isLoading ? (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div className="py-16 text-center">
                  <Spin size="large" style={{ color: '#FF6A00' }} />
                  <p className="mt-4 text-gray-500 text-base">Đang tải đơn hàng...</p>
                </div>
              </Card>
            ) : error ? (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div className="py-8 text-center">
                  <Text type="danger" className="text-base">{error}</Text>
                </div>
              </Card>
            ) : orders.length === 0 ? (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p className="text-gray-600 font-medium text-base mb-1">Chưa có đơn hàng nào</p>
                      <p className="text-sm text-gray-500">
                        {search || status !== 'ALL' 
                          ? 'Bạn chưa có đơn hàng phù hợp với bộ lọc đã chọn.' 
                          : 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!'}
                      </p>
                    </div>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    ghnOrderData={ghnOrderData}
                    onOrderCancelled={() => load()}
                  />
                ))}
              </div>
            )}

            {/* Pagination - Tối giản và đẹp hơn */}
            {orders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 px-4 py-3">
                {/* Page Size Selector - Compact */}
                <div className="flex items-center gap-2">
                  <Text className="text-sm text-gray-600">Hiển thị</Text>
                  <Select
                    value={pageSize}
                    onChange={async (newPageSize) => {
                      setPageSize(newPageSize);
                      setPage(1);
                      await load(false, { pageSize: newPageSize, page: 1 });
                    }}
                    style={{ 
                      width: 80, 
                      borderRadius: '6px',
                    }}
                    size="middle"
                    bordered={false}
                    className="[&_.ant-select-selector]:border-gray-200 [&_.ant-select-selector]:rounded-md"
                  >
                    <Option value={5}>5</Option>
                    <Option value={10}>10</Option>
                    <Option value={15}>15</Option>
                    <Option value={20}>20</Option>
                  </Select>
                  <Text className="text-sm text-gray-500">/ trang</Text>
                </div>

                {/* Pagination Info & Controls */}
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  {/* Compact Info */}
                  <Text className="text-sm text-gray-600 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{page}</span>
                    <span className="mx-1">/</span>
                    <span className="font-medium text-gray-900">{totalPages}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-gray-500">Tổng:</span>
                    <span className="ml-1 font-semibold text-[#FF6A00]">{total || 0}</span>
                  </Text>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination
                      current={page}
                      total={totalPages}
                      pageSize={1}
                      onChange={async (newPage) => {
                        setPage(newPage);
                        await load(false, { page: newPage });
                      }}
                      showSizeChanger={false}
                      showQuickJumper={totalPages > 10}
                      showLessItems
                      size="small"
                      style={{ margin: 0 }}
                      className="custom-pagination-simple"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <OrderDetailModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        ghnOrderData={ghnOrderData}
        onOrderCancelled={() => load()}
      />
    </Layout>
  );
};

export default OrderHistoryPage;

