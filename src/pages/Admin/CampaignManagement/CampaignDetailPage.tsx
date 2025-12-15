import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Tag,
  Row,
  Col,
  Statistic,
  Collapse,
  Image,
  Spin,
  Empty,
  Typography,
  Space,
  Button,
  Table,
  Select,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShopOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TagOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  AdminCampaignDetail,
  AdminCampaignStoreGroup,
  AdminCampaignProductRow,
  AdminCampaignProductStatus,
  CampaignStatus,
  CampaignType
} from '../../../types/admin';
import type { Product } from '../../../types/seller';
import { HttpInterceptor } from '../../../services/HttpInterceptor';
import { CampaignService } from '../../../services/admin/CampaignService';
import { showTikiNotification } from '../../../utils/notification';
import type { ColumnsType } from 'antd/es/table';

const { Panel } = Collapse;
const { Title, Text } = Typography;

const getTypeTag = (type: CampaignType) => {
  return type === 'MEGA_SALE'
    ? <Tag color="purple">Mega Sale</Tag>
    : <Tag color="orange">Flash Sale</Tag>;
};

const getStatusTag = (status?: CampaignStatus) => {
  if (!status) return null;
  const config: Record<CampaignStatus, { color: string; text: string }> = {
    DRAFT: { color: 'default', text: 'Bản nháp' },
    ONOPEN: { color: 'processing', text: 'Mở đăng ký' },
    ACTIVE: { color: 'success', text: 'Đang diễn ra' },
    APPROVE: { color: 'purple', text: 'Đã duyệt' },
    DISABLED: { color: 'warning', text: 'Vô hiệu hóa' },
    EXPIRED: { color: 'error', text: 'Hết hạn' }
  };
  const cfg = config[status];
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

const formatRange = (start: string, end: string) => {
  const s = dayjs(start);
  const e = dayjs(end);
  return `${s.format('DD/MM/YYYY HH:mm')} - ${e.format('DD/MM/YYYY HH:mm')}`;
};

const CampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<AdminCampaignDetail | null>(null);
  // Enriched products with full product & variants
  interface VariantRow {
    variantId: string;
    variantName: string;
    variantPrice: number;
    variantStock: number;
    variantImage?: string;
    variantSku?: string;
  }

  interface AdminCampaignProductWithDetails extends AdminCampaignProductRow {
    fullProduct?: Product;
    variantData?: VariantRow[];
  }

  const [products, setProducts] = useState<AdminCampaignProductWithDetails[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AdminCampaignProductStatus | 'ALL'>('ALL');
  const [selectedStoreId, setSelectedStoreId] = useState<string | 'ALL'>('ALL');

  useEffect(() => {
    if (!campaignId) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await CampaignService.getCampaignDetail(campaignId);
        setDetail(data);
      } catch (error: any) {
        showTikiNotification(
          error.message || 'Không thể tải chi tiết chiến dịch',
          'Lỗi',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [campaignId]);

  // Fetch flat products from /api/campaigns/products/details
  useEffect(() => {
    if (!campaignId) return;

    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const rows = await CampaignService.getCampaignProducts({
          campaignId,
          storeId: selectedStoreId === 'ALL' ? undefined : selectedStoreId,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus
        });
        // Enrich with full product + variants (for image & variant info)
        const enriched = await enrichProductsWithDetails(rows);
        setProducts(enriched);
      } catch (error: any) {
        showTikiNotification(
          error.message || 'Không thể tải chi tiết sản phẩm trong chiến dịch',
          'Lỗi',
          'error'
        );
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [campaignId, selectedStoreId, selectedStatus]);

  const enrichProductsWithDetails = async (
    rows: AdminCampaignProductRow[]
  ): Promise<AdminCampaignProductWithDetails[]> => {
    try {
      const productIds = Array.from(new Set(rows.map((r) => r.productId)));

      const productPromises = productIds.map(async (productId) => {
        try {
          const response = await HttpInterceptor.fetch<{ status: number; message: string; data: Product }>(
            `/api/products/${productId}`,
            {
              method: 'GET',
              userType: 'admin'
            }
          );
          return response.data;
        } catch (error) {
          console.warn(`Failed to fetch product ${productId}:`, error);
          return null;
        }
      });

      const products = await Promise.all(productPromises);
      const productMap = new Map<string, Product>();
      products.forEach((p) => {
        if (p) productMap.set(p.productId, p);
      });

      const enriched: AdminCampaignProductWithDetails[] = rows.map((row) => {
        const fullProduct = productMap.get(row.productId);
        const variantData: VariantRow[] | undefined =
          fullProduct?.variants && fullProduct.variants.length > 0
            ? fullProduct.variants.map((v) => ({
                variantId: v.variantId || `${fullProduct.productId}-variant`,
                variantName: v.optionValue,
                variantPrice: v.variantPrice,
                variantStock: v.variantStock,
                variantImage: v.variantUrl,
                variantSku: v.variantSku
              }))
            : undefined;

        return {
          ...row,
          fullProduct,
          variantData
        };
      });

      return enriched;
    } catch (error) {
      console.error('Error enriching products with details:', error);
      return rows;
    }
  };

  const summary = useMemo(() => {
    if (!detail) return { totalStores: 0, totalProducts: 0 };
    const stores = detail.stores || [];
    const totalStores = stores.length;
    const totalProducts = stores.reduce(
      (sum, store) => sum + (store.products?.length || 0),
      0
    );
    return { totalStores, totalProducts };
  }, [detail]);

  const renderStorePanelHeader = (store: AdminCampaignStoreGroup) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <ShopOutlined className="text-blue-500" />
        <span className="font-medium text-gray-900">{store.storeName}</span>
        <Tag color="blue">{store.products.length} sản phẩm</Tag>
      </div>
    </div>
  );

  const statusOptions: { label: string; value: AdminCampaignProductStatus | 'ALL' }[] = [
    { label: 'Tất cả trạng thái', value: 'ALL' },
    { label: 'Chờ duyệt', value: 'DRAFT' },
    { label: 'Đã duyệt', value: 'APPROVE' },
    { label: 'Đang hoạt động', value: 'ACTIVE' },
    { label: 'Hết hạn', value: 'EXPIRED' },
    { label: 'Từ chối', value: 'REJECTED' },
    { label: 'Vô hiệu hóa', value: 'DISABLED' }
  ];

  const storeFilterOptions = useMemo(() => {
    const all: { label: string; value: string | 'ALL' }[] = [
      { label: 'Tất cả shop', value: 'ALL' }
    ];
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (!map.has(p.storeId)) {
        map.set(p.storeId, p.storeName);
      }
    });
    map.forEach((name, id) => {
      all.push({ label: name, value: id });
    });
    return all;
  }, [products]);

  const renderProductStatusTag = (status: AdminCampaignProductStatus) => {
    const config: Record<AdminCampaignProductStatus, { color: string; text: string }> = {
      DRAFT: { color: 'orange', text: 'Chờ duyệt' },
      APPROVE: { color: 'green', text: 'Đã duyệt' },
      ACTIVE: { color: 'blue', text: 'Đang hoạt động' },
      EXPIRED: { color: 'default', text: 'Hết hạn' },
      REJECTED: { color: 'red', text: 'Bị từ chối' },
      DISABLED: { color: 'volcano', text: 'Vô hiệu hóa' }
    };
    const cfg = config[status];
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  const productColumns: ColumnsType<AdminCampaignProductWithDetails> = useMemo(
    () => [
      {
        title: 'Shop',
        dataIndex: 'storeName',
        key: 'storeName',
        width: 200,
        render: (text: string) => (
          <div className="flex items-center gap-2">
            <ShopOutlined className="text-gray-400" />
            <Text strong>{text}</Text>
          </div>
        )
      },
      {
        title: 'Sản phẩm',
        dataIndex: 'productName',
        key: 'productName',
        width: 360,
        render: (text: string, record) => {
          const hasVariants = !!record.variantData && record.variantData.length > 0;

          const variantTooltip = hasVariants ? (
            <div style={{ maxWidth: 360 }}>
              <div className="font-medium mb-2">Danh sách biến thể</div>
              <div className="text-xs text-gray-500 mb-1">
                Tổng {record.variantData!.length} biến thể
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pr-2 py-1">Tên</th>
                    <th className="text-right pr-2 py-1">Giá</th>
                    <th className="text-right py-1">Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {record.variantData!.map((v) => (
                    <tr key={v.variantId}>
                      <td className="pr-2 py-1">{v.variantName}</td>
                      <td className="text-right pr-2 py-1">
                        {v.variantPrice.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="text-right py-1">{v.variantStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null;

          const basePrice =
            record.fullProduct?.finalPrice ??
            record.fullProduct?.price ??
            null;
          const baseStock = record.fullProduct?.stockQuantity ?? null;

          return (
            <div className="flex items-start gap-3">
              <Image
                src={record.fullProduct?.images?.[0]}
                alt={text}
                width={60}
                height={60}
                className="rounded object-cover"
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 line-clamp-2">{text}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Thương hiệu: {record.brandName}
                </div>

                {!hasVariants && (basePrice || baseStock !== null) && (
                  <div className="text-xs text-gray-500 mt-1">
                    Giá: {basePrice ? `${basePrice.toLocaleString('vi-VN')}₫` : '—'} • Tồn kho:{' '}
                    {baseStock !== null ? baseStock : '—'}
                  </div>
                )}

                {hasVariants && (
                  <Tooltip title={variantTooltip} placement="topLeft">
                    <div className="text-xs text-blue-600 mt-1 cursor-pointer underline underline-offset-2">
                      Xem chi tiết {record.variantData!.length} biến thể (giá & tồn kho)
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        }
      },
      {
        title: 'Chiết khấu',
        key: 'discount',
        width: 140,
        render: (_, record) => {
          if (record.discountType === 'PERCENT') {
            return (
              <Space direction="vertical" size={0}>
                <Text strong>{record.discountPercent}%</Text>
                <Text type="secondary" className="text-xs">
                  Tối đa:{' '}
                  {record.maxDiscountValue
                    ? `${record.maxDiscountValue.toLocaleString('vi-VN')}₫`
                    : 'Không giới hạn'}
                </Text>
              </Space>
            );
          }
          return (
            <Space direction="vertical" size={0}>
              <Text strong>
                {record.discountValue ? record.discountValue.toLocaleString('vi-VN') : 0}₫
              </Text>
              <Text type="secondary" className="text-xs">
                Đơn tối thiểu:{' '}
                {record.minOrderValue
                  ? `${record.minOrderValue.toLocaleString('vi-VN')}₫`
                  : 'Không yêu cầu'}
              </Text>
            </Space>
          );
        }
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (status: AdminCampaignProductStatus) => renderProductStatusTag(status)
      }
    ],
    [renderProductStatusTag]
  );

  return (
    <div className="p-6 space-y-4">
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/campaigns')}
        className="px-0"
      >
        Quay lại danh sách chiến dịch
      </Button>

      {loading && (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" />
        </div>
      )}

      {!loading && !detail && (
        <Empty description="Không tìm thấy dữ liệu chiến dịch" />
      )}

      {!loading && detail && (
        <>
          {/* Header */}
          <Card className="mb-4">
            <Row gutter={16} align="middle">
              <Col xs={24} md={16}>
                <Space direction="vertical" size={8}>
                  <Space size={8}>
                    {detail.badgeIconUrl && (
                      <Image
                        src={detail.badgeIconUrl}
                        alt={detail.badgeLabel || detail.campaignName}
                        width={40}
                        height={40}
                        preview={false}
                      />
                    )}
                    <Title level={4} style={{ margin: 0 }}>
                      {detail.campaignName}
                    </Title>
                    {getTypeTag(detail.campaignType)}
                    {getStatusTag(detail.status)}
                  </Space>
                  <Space size={12}>
                    <ClockCircleOutlined className="text-gray-500" />
                    <Text strong>{formatRange(detail.startTime, detail.endTime)}</Text>
                  </Space>
                  {detail.badgeLabel && (
                    <Tag color={detail.badgeColor || 'orange'}>
                      <ThunderboltOutlined /> {detail.badgeLabel}
                    </Tag>
                  )}
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Tổng số shop"
                      value={summary.totalStores}
                      prefix={<ShopOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Tổng số sản phẩm"
                      value={summary.totalProducts}
                      prefix={<ShoppingOutlined />}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* Products grouped by store (tổng quan theo shop) */}
          <Card
            title="Sản phẩm trong chiến dịch"
            extra={
              <Button
                type="default"
                onClick={() =>
                  navigate(`/admin/campaigns/products/approval?campaignId=${detail.campaignId}`)
                }
              >
                Quản lý phê duyệt sản phẩm
              </Button>
            }
          >
            {detail.stores.length === 0 ? (
              <Empty description="Chưa có sản phẩm nào trong chiến dịch" />
            ) : (
              <Collapse accordion>
                {detail.stores.map((store) => (
                  <Panel header={renderStorePanelHeader(store)} key={store.storeId}>
                    <Row gutter={[16, 16]}>
                      {store.products.map((product) => (
                        <Col
                          xs={24}
                          sm={12}
                          md={8}
                          lg={6}
                          key={product.productId}
                          style={{ display: 'flex' }}
                        >
                          <Card
                            hoverable
                            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
                            bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                            cover={
                              <Image
                                src={product.productImage}
                                alt={product.productName}
                                height={180}
                                width="100%"
                                style={{ objectFit: 'cover' }}
                                preview={false}
                              />
                            }
                          >
                            <div className="flex flex-col flex-1">
                              <Space direction="vertical" size={6} className="flex-1">
                                <Text strong className="line-clamp-2">
                                  {product.productName}
                                </Text>
                                {product.voucher && (
                                  <Text type="secondary" className="text-xs">
                                    Ưu đãi:{' '}
                                    {product.voucher.type === 'PERCENT'
                                      ? `Giảm ${product.voucher.discountPercent}%`
                                      : `Giảm ${product.voucher.discountValue?.toLocaleString('vi-VN')}₫`}
                                  </Text>
                                )}
                                <Text type="secondary" className="text-xs">
                                  Thời gian đăng ký:&nbsp;
                                  {dayjs(product.registeredAt).format('HH:mm:ss | DD/MM/YYYY')}
                                </Text>
                                {product.flashSaleSlots && product.flashSaleSlots.length > 0 && (
                                  <Text type="secondary" className="text-xs">
                                    <ThunderboltOutlined /> {product.flashSaleSlots.length} khung giờ Flash Sale
                                  </Text>
                                )}
                              </Space>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Panel>
                ))}
              </Collapse>
            )}
          </Card>

          {/* Flat product table based on /api/campaigns/products/details */}
          <Card
            title="Bảng chi tiết sản phẩm (theo trạng thái & shop)"
            className="mt-4"
            extra={
              <Space>
                <Select
                  value={selectedStoreId}
                  options={storeFilterOptions}
                  onChange={setSelectedStoreId}
                  style={{ width: 200 }}
                  placeholder="Lọc theo shop"
                />
                <Select
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={setSelectedStatus}
                  style={{ width: 200 }}
                  placeholder="Lọc theo trạng thái"
                />
              </Space>
            }
          >
            <Table<AdminCampaignProductWithDetails>
              rowKey="campaignProductId"
              loading={productsLoading}
              dataSource={products}
              columns={productColumns}
              scroll={{ x: 900 }}
              expandable={{
                expandedRowRender: (record) => {
                  const basePrice =
                    record.fullProduct?.finalPrice ??
                    record.fullProduct?.price ??
                    0;
                  const baseStock = record.fullProduct?.stockQuantity ?? 0;

                  const hasVariants = !!record.variantData && record.variantData.length > 0;

                  const columns: ColumnsType<VariantRow> = [
                    {
                      title: 'Phân loại hàng',
                      key: 'variant',
                      width: 260,
                      render: (_, variant) => (
                        <div className="flex items-center gap-3">
                          <Image
                            src={variant.variantImage || record.fullProduct?.images?.[0]}
                            alt={variant.variantName}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                            fallback="https://via.placeholder.com/40"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {variant.variantName || record.productName}
                            </div>
                            {variant.variantSku && (
                              <div className="text-xs text-gray-500 mt-1">
                                SKU: {variant.variantSku}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    },
                    {
                      title: 'Giá gốc',
                      dataIndex: 'variantPrice',
                      key: 'variantPrice',
                      width: 140,
                      align: 'right',
                      render: (price: number) => {
                        const value = price || basePrice;
                        if (!value) return <span className="text-gray-400">N/A</span>;
                        return (
                          <span className="font-medium text-orange-600 text-sm">
                            {value.toLocaleString('vi-VN')}₫
                          </span>
                        );
                      }
                    },
                    {
                      title: 'Giá giảm',
                      key: 'discountValue',
                      width: 140,
                      align: 'right',
                      render: (_, variant) => {
                        const price = variant.variantPrice || basePrice;
                        if (!price) return <span className="text-gray-400">N/A</span>;

                        let discountAmount = 0;
                        if (record.discountType === 'PERCENT' && record.discountPercent) {
                          discountAmount = (price * record.discountPercent) / 100;
                          if (record.maxDiscountValue) {
                            discountAmount = Math.min(discountAmount, record.maxDiscountValue);
                          }
                        } else if (record.discountType === 'FIXED' && record.discountValue) {
                          discountAmount = record.discountValue;
                        }

                        if (!discountAmount) {
                          return <span className="text-gray-400">N/A</span>;
                        }

                        return (
                          <span className="text-red-500 text-sm">
                            -{discountAmount.toLocaleString('vi-VN')}₫
                          </span>
                        );
                      }
                    },
                    {
                      title: 'Giá sau giảm',
                      key: 'finalPrice',
                      width: 160,
                      align: 'right',
                      render: (_, variant) => {
                        const price = variant.variantPrice || basePrice;
                        if (!price) return <span className="text-gray-400">N/A</span>;

                        let discountAmount = 0;
                        if (record.discountType === 'PERCENT' && record.discountPercent) {
                          discountAmount = (price * record.discountPercent) / 100;
                          if (record.maxDiscountValue) {
                            discountAmount = Math.min(discountAmount, record.maxDiscountValue);
                          }
                        } else if (record.discountType === 'FIXED' && record.discountValue) {
                          discountAmount = record.discountValue;
                        }

                        const final = Math.max(0, price - discountAmount);

                        return (
                          <div className="text-right">
                            <div className="font-semibold text-green-600 text-sm">
                              {final.toLocaleString('vi-VN')}₫
                            </div>
                            <div className="text-xs text-gray-400 line-through">
                              {price.toLocaleString('vi-VN')}₫
                            </div>
                          </div>
                        );
                      }
                    },
                    {
                      title: 'Kho',
                      dataIndex: 'variantStock',
                      key: 'variantStock',
                      width: 100,
                      align: 'center',
                      render: (stock: number) => {
                        const value = stock ?? baseStock;
                        const color = value > 0 ? 'success' : 'error';
                        return (
                          <Tag color={color} className="text-xs">
                            {value > 0 ? `${value}` : 'Hết'}
                          </Tag>
                        );
                      }
                    }
                  ];

                  const dataSource: VariantRow[] = hasVariants
                    ? record.variantData!
                    : [
                        {
                          variantId: record.productId,
                          variantName: record.productName,
                          variantPrice: basePrice,
                          variantStock: baseStock,
                          variantImage: record.fullProduct?.images?.[0],
                          variantSku: record.fullProduct?.sku
                        }
                      ];

                  return (
                    <div className="ml-10 mt-2">
                      <Row gutter={16}>
                        <Col xs={24} md={8}>
                          <Space direction="vertical" size={10} className="text-sm">
                            <Space align="center">
                              <TagOutlined className="text-orange-500" />
                              <Text strong>Thông tin khuyến mãi</Text>
                            </Space>
                            <Space direction="vertical" size={2}>
                              <Text>
                                Hình thức:&nbsp;
                                {record.discountType === 'PERCENT'
                                  ? `Giảm ${record.discountPercent}%`
                                  : `Giảm ${record.discountValue?.toLocaleString('vi-VN') || 0}₫`}
                              </Text>
                              <Text type="secondary">
                                Đơn tối thiểu:&nbsp;
                                {record.minOrderValue
                                  ? `${record.minOrderValue.toLocaleString('vi-VN')}₫`
                                  : 'Không yêu cầu'}
                              </Text>
                              {record.maxDiscountValue && (
                                <Text type="secondary">
                                  Giảm tối đa:&nbsp;{record.maxDiscountValue.toLocaleString('vi-VN')}₫
                                </Text>
                              )}
                            </Space>

                            <div className="border-t border-gray-200 my-2" />

                            <Space align="center">
                              <InfoCircleOutlined className="text-blue-500" />
                              <Text strong>Voucher & giới hạn</Text>
                            </Space>
                            <Space direction="vertical" size={2}>
                              <Text>
                                Số lượng phát hành:&nbsp;<strong>{record.totalVoucherIssued}</strong>
                              </Text>
                              <Text>
                                Số lượt còn lại:&nbsp;<strong>{record.remainingUsage}</strong>
                              </Text>
                              <Text type="secondary">
                                Mỗi khách:&nbsp;{record.usagePerUser} | Tổng số lượt dùng:&nbsp;
                                {record.totalUsageLimit}
                              </Text>
                            </Space>

                            <div className="border-t border-gray-200 my-2" />

                            <Space align="center">
                              <ClockCircleOutlined className="text-green-500" />
                              <Text strong>Thời gian áp dụng</Text>
                            </Space>
                            <Space direction="vertical" size={2}>
                              <Text>
                                Bắt đầu:&nbsp;
                                {dayjs(record.startTime).format('HH:mm:ss | DD/MM/YYYY')}
                              </Text>
                              <Text>
                                Kết thúc:&nbsp;
                                {dayjs(record.endTime).format('HH:mm:ss | DD/MM/YYYY')}
                              </Text>
                              <Text type="secondary">
                                Đăng ký:&nbsp;
                                {dayjs(record.registeredAt).format('HH:mm:ss | DD/MM/YYYY')}
                              </Text>
                              {record.approvedAt && (
                                <Text type="secondary">
                                  Duyệt:&nbsp;
                                  {dayjs(record.approvedAt).format('HH:mm:ss | DD/MM/YYYY')}
                                </Text>
                              )}
                            </Space>

                            <div className="border-t border-gray-200 my-2" />

                            <Space align="center">
                              <ThunderboltOutlined className="text-yellow-500" />
                              <Text strong>Slot Flash Sale</Text>
                            </Space>
                            {record.slot ? (
                              <Space direction="vertical" size={2}>
                                <Text>
                                  Bắt đầu:&nbsp;
                                  {dayjs(record.slot.openTime).format('HH:mm:ss | DD/MM/YYYY')}
                                </Text>
                                <Text>
                                  Kết thúc:&nbsp;
                                  {dayjs(record.slot.closeTime).format('HH:mm:ss | DD/MM/YYYY')}
                                </Text>
                                <Tag
                                  color={
                                    record.slot.slotStatus === 'ACTIVE'
                                      ? 'green'
                                      : record.slot.slotStatus === 'PENDING'
                                      ? 'orange'
                                      : 'default'
                                  }
                                >
                                  {record.slot.slotStatus === 'ACTIVE'
                                    ? 'Đang diễn ra'
                                    : record.slot.slotStatus === 'PENDING'
                                    ? 'Chờ bắt đầu'
                                    : 'Đã kết thúc'}
                                </Tag>
                              </Space>
                            ) : (
                              <Text type="secondary">Không có</Text>
                            )}

                            <div className="border-t border-gray-200 my-2" />

                            <Space align="center">
                              <InfoCircleOutlined className="text-gray-500" />
                              <Text strong>Lý do / ghi chú</Text>
                            </Space>
                            <Text type={record.reason ? undefined : 'secondary'}>
                              {record.reason || '—'}
                            </Text>
                          </Space>
                        </Col>
                        <Col xs={24} md={16}>
                          <Table<VariantRow>
                            columns={columns}
                            dataSource={dataSource}
                            rowKey="variantId"
                            pagination={false}
                            size="small"
                          />
                        </Col>
                      </Row>
                    </div>
                  );
                },
                rowExpandable: () => true
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `${total} sản phẩm`
              }}
              locale={{
                emptyText: 'Không có sản phẩm nào khớp bộ lọc'
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default CampaignDetailPage;


