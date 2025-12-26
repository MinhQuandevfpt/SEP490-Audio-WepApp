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
  Statistic,
  Divider
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
  
  // Debounce helper để tránh giật UI khi update state
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

  // Load orders function
  const load = useCallback(async (silent: boolean = false, overrideParams?: { status?: OrderStatus | 'ALL'; search?: string; page?: number; pageSize?: number }) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      
      // Sử dụng overrideParams nếu có, nếu không dùng từ state
      const currentStatus = overrideParams?.status ?? status;
      const currentSearch = overrideParams?.search ?? search;
      const currentPage = overrideParams?.page ?? page;
      const currentPageSize = overrideParams?.pageSize ?? pageSize;
      
      // Backend uses 0-based indexing
      const backendPage = currentPage - 1;
      
      const res = await OrderHistoryService.list({
        status: currentStatus === 'ALL' ? undefined : currentStatus,
        search: currentSearch || undefined,
        page: backendPage,
        size: currentPageSize,
      });
      
      // Update từng field nhỏ, không replace toàn state
      ordersRef.current = res.data;
      startTransition(() => {
        debouncedSetOrders(res.data);
        setTotal(prev => prev !== res.total ? res.total : prev);
        setTotalPages(prev => prev !== res.totalPages ? res.totalPages : prev);
      });
      
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
              onChange={(newStatus) => {
                setStatus(newStatus);
                setPage(1);
                load(false, { status: newStatus, page: 1, pageSize });
              }}
              search={search}
              onSearchChange={(newSearch) => {
                setSearch(newSearch);
                setPage(1);
                load(false, { search: newSearch, page: 1, pageSize });
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

            {/* Pagination & Page Size Selector */}
            {orders.length > 0 && (
              <Card 
                className="border-gray-200 shadow-sm"
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                styles={{ 
                  body: { padding: '20px 24px' }
                }}
              >
                <Row gutter={[24, 16]} align="middle" justify="space-between">
                  {/* Page Size Selector */}
                  <Col xs={24} sm={12} md={8}>
                    <Space size="middle" className="w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <Text className="text-sm font-medium text-gray-700">Hiển thị:</Text>
                        <Select
                          value={pageSize}
                          onChange={(newPageSize) => {
                            setPageSize(newPageSize);
                            setPage(1);
                            load(false, { pageSize: newPageSize, page: 1 });
                          }}
                          style={{ 
                            width: 150, 
                            borderRadius: '8px',
                            minWidth: '150px'
                          }}
                          size="large"
                        >
                          <Option value={5}>5 đơn hàng</Option>
                          <Option value={10}>10 đơn hàng</Option>
                          <Option value={15}>15 đơn hàng</Option>
                          <Option value={20}>20 đơn hàng</Option>
                        </Select>
                        <Text className="text-sm text-gray-500 hidden sm:inline">/ trang</Text>
                      </div>
                    </Space>
                  </Col>

                  {/* Pagination */}
                  <Col xs={24} sm={12} md={16}>
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                      {/* Total Info */}
                      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <Text className="text-sm text-gray-600">
                          Trang <strong className="text-gray-900">{page}</strong> / <strong className="text-gray-900">{totalPages}</strong>
                        </Text>
                        <Divider type="vertical" style={{ height: '16px', margin: '0 8px' }} />
                        <Text className="text-sm text-gray-600">
                          Tổng: <strong className="text-orange-600">{total || 0}</strong> đơn hàng
                        </Text>
                      </div>

                      {/* Pagination Component */}
                      {totalPages > 1 && (
                        <Pagination
                          current={page}
                          total={totalPages * pageSize}
                          pageSize={pageSize}
                          onChange={(newPage) => {
                            setPage(newPage);
                            load(false, { page: newPage });
                          }}
                          showSizeChanger={false}
                          showQuickJumper={totalPages > 5}
                          showTotal={(total, range) => (
                            <span className="text-sm text-gray-600 hidden lg:inline">
                              Hiển thị <strong className="text-gray-900">{range[0]}-{range[1]}</strong> của <strong className="text-gray-900">{total}</strong> đơn hàng
                            </span>
                          )}
                          style={{ 
                            textAlign: 'right',
                          }}
                          className="custom-pagination"
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
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

