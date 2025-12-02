import React, { useEffect, useState, useCallback } from 'react';
import { X, Package, Tag, DollarSign, Warehouse, User, Award, Info } from 'lucide-react';
import { ProductService } from '../../../services/seller/ProductService';
import type { Product } from '../../../types/seller';
import { useProvinces } from '../../../hooks/useProvinces';
import { useDistricts } from '../../../hooks/useDistricts';
import { useWards } from '../../../hooks/useWards';
import { translatePlacementType } from '../../../components/CreateProductForSellerUIComponent/CategorySpecsSchema';

interface ProductDetailDrawerProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({ productId, isOpen, onClose }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load location data
  const { getProvinceById } = useProvinces();
  const { getDistrictById } = useDistricts(product?.provinceCode ? parseInt(product.provinceCode) : 0);
  const { getWardByCode } = useWards(product?.districtCode ? parseInt(product.districtCode) : 0);

  const loadProductDetail = useCallback(async () => {
    if (!productId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await ProductService.getProductById(productId);
      setProduct(data);
    } catch (err) {
      console.error('Error loading product detail:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải chi tiết sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen && productId) {
      loadProductDetail();
    }
  }, [isOpen, productId, loadProductDetail]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-1/2 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết sản phẩm</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-600"></div>
                <p className="mt-4 text-gray-600">Đang tải...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Product Detail */}
          {product && !isLoading && !error && (
            <div className="p-6 space-y-6">
              {/* Images Gallery */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-orange-600" />
                  Hình ảnh sản phẩm
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.images && product.images.length > 0 && product.images[0] !== 'string' ? (
                    product.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={image}
                          alt={`${product.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="aspect-square bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                {product.videoUrl && product.videoUrl !== 'string' && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Video giới thiệu:</p>
                    <video 
                      src={product.videoUrl}
                      controls 
                      className="w-full rounded-lg max-h-80"
                    >
                      Trình duyệt không hỗ trợ video
                    </video>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-orange-600" />
                  Thông tin cơ bản
                </h3>
                <div className="space-y-3">
                  <InfoRow label="ID sản phẩm" value={product.productId} valueClassName="font-mono text-orange-600" />
                  <InfoRow label="Tên sản phẩm" value={product.name} />
                  <InfoRow label="Thương hiệu" value={product.brandName} />
                  <InfoRow label="Danh mục" value={product.categoryName} />
                  <InfoRow label="Model" value={product.model} />
                  <InfoRow label="SKU" value={product.sku} valueClassName="font-mono" />
                  <InfoRow label="Slug" value={product.slug} valueClassName="text-sm" />
                  <InfoRow 
                    label="Trạng thái" 
                    value={
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ProductService.getStatusColor(product.status)
                      }`}>
                        {ProductService.getStatusLabel(product.status)}
                      </span>
                    } 
                  />
                  <InfoRow label="Mô tả ngắn" value={product.shortDescription} />
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</p>
                    <div 
                      className="text-sm text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description || '' }}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                  Thông tin giá
                </h3>
                
                {/* Check if product has variants */}
                {product.variants && product.variants.length > 0 ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Sản phẩm có {product.variants.length} phân loại biến thể
                      </p>
                      <div className="text-sm text-blue-700">
                        {(() => {
                          const prices = product.variants.map(v => v.variantPrice);
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          // Backend already calculates total stock
                          const totalStock = product.stockQuantity;
                          
                          return (
                            <>
                              <div className="flex justify-between items-center mb-1">
                                <span>Khoảng giá:</span>
                                <span className="font-semibold text-orange-600">
                                  {minPrice === maxPrice 
                                    ? ProductService.formatCurrency(minPrice)
                                    : `${ProductService.formatCurrency(minPrice)} - ${ProductService.formatCurrency(maxPrice)}`
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Tổng kho:</span>
                                <span className="font-semibold text-green-600">{totalStock} sản phẩm</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Variants Details */}
                    <div className="space-y-3">
                      <p className="font-semibold text-sm">Chi tiết phân loại:</p>
                      {product.variants.map((variant, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            {variant.variantUrl && (
                              <img
                                src={variant.variantUrl}
                                alt={variant.optionValue}
                                className="w-16 h-16 rounded object-cover flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {variant.optionName}: <span className="text-blue-600">{variant.optionValue}</span>
                                </p>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">SKU</p>
                                  <p className="font-mono font-medium text-gray-900">{variant.variantSku}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Giá</p>
                                  <p className="font-semibold text-orange-600">{ProductService.formatCurrency(variant.variantPrice)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Kho</p>
                                  <p className={`font-semibold ${
                                    variant.variantStock === 0 ? 'text-red-600' :
                                    variant.variantStock < 10 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {variant.variantStock}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Product without variants - show regular pricing
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800">
                        Sản phẩm không có phân loại biến thể
                      </p>
                    </div>
                    <InfoRow label="Giá gốc" value={ProductService.formatCurrency(product.price)} valueClassName="font-semibold" />
                    <InfoRow label="Giá sau khuyến mãi" value={ProductService.formatCurrency(product.priceAfterPromotion)} />
                    <InfoRow label="Giá cuối cùng" value={ProductService.formatCurrency(product.finalPrice)} valueClassName="text-orange-600 font-bold text-lg" />
                  </div>
                )}

                {/* Common pricing info */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <InfoRow label="Đơn vị tiền tệ" value={product.currency} />
                  {product.platformFeePercent && (
                    <InfoRow label="Phí nền tảng" value={`${product.platformFeePercent}%`} />
                  )}
                </div>

                {/* Bulk Discounts */}
                {product.bulkDiscounts && product.bulkDiscounts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-semibold text-sm mb-2">Giảm giá theo số lượng:</p>
                    <div className="space-y-2">
                      {product.bulkDiscounts.map((discount, index) => (
                        <div key={index} className="text-sm bg-green-50 p-2 rounded">
                          <span className="font-medium">
                            Từ {discount.fromQuantity} đến {discount.toQuantity} sản phẩm:
                          </span>
                          <span className="ml-2 text-green-700 font-semibold">
                            {ProductService.formatCurrency(discount.unitPrice)}/sp
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock & Warehouse */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Warehouse className="w-5 h-5 mr-2 text-orange-600" />
                  Kho hàng & Vận chuyển
                </h3>
                <div className="space-y-3">
                  {product.variants && product.variants.length > 0 ? (
                    <InfoRow 
                      label="Tồn kho (tổng)" 
                      value={
                        <span className={`font-semibold ${
                          product.stockQuantity === 0 ? 'text-red-600' :
                          product.stockQuantity < 10 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {product.stockQuantity} sản phẩm
                        </span>
                      }
                    />
                  ) : (
                    <InfoRow 
                      label="Tồn kho" 
                      value={
                        <span className={`font-semibold ${
                          product.stockQuantity === 0 ? 'text-red-600' :
                          product.stockQuantity < 10 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {product.stockQuantity} sản phẩm
                        </span>
                      }
                    />
                  )}
                  <InfoRow label="Vị trí kho" value={product.warehouseLocation} />
                  {product.provinceCode && (
                    <InfoRow 
                      label="Tỉnh/Thành phố" 
                      value={getProvinceById(parseInt(product.provinceCode))?.ProvinceName || product.provinceCode} 
                    />
                  )}
                  {product.districtCode && (
                    <InfoRow 
                      label="Quận/Huyện" 
                      value={getDistrictById(parseInt(product.districtCode))?.DistrictName || product.districtCode} 
                    />
                  )}
                  {product.wardCode && (
                    <InfoRow 
                      label="Phường/Xã" 
                      value={getWardByCode(product.wardCode)?.WardName || product.wardCode} 
                    />
                  )}
                  <InfoRow label="Địa chỉ giao hàng" value={product.shippingAddress} />
                  <InfoRow label="Phí vận chuyển" value={product.shippingFee ? ProductService.formatCurrency(product.shippingFee) : 'Miễn phí'} />
                </div>
              </div>

              {/* Physical Properties */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-orange-600" />
                  Thuộc tính vật lý
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Màu sắc" value={product.color} />
                  <InfoRow label="Chất liệu" value={product.material} />
                  <InfoRow label="Kích thước" value={product.dimensions} />
                  <InfoRow label="Trọng lượng" value={product.weight ? `${product.weight} kg` : null} />
                  <InfoRow label="Tình trạng" value={product.productCondition} />
                  <InfoRow label="Sản phẩm tùy chỉnh" value={product.isCustomMade ? 'Có' : 'Không'} />
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-orange-600" />
                  Thông số kỹ thuật
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.frequencyResponse && <SpecItem label="Đáp tần" value={product.frequencyResponse} />}
                  {product.sensitivity && <SpecItem label="Độ nhạy" value={product.sensitivity} />}
                  {product.impedance && <SpecItem label="Trở kháng" value={`${product.impedance} Ω`} />}
                  {product.powerHandling && <SpecItem label="Công suất" value={product.powerHandling} />}
                  {product.connectionType && <SpecItem label="Kết nối" value={product.connectionType} />}
                  {product.voltageInput && <SpecItem label="Điện áp" value={product.voltageInput} />}
                  
                  {/* Speaker specs */}
                  {product.driverConfiguration && <SpecItem label="Cấu hình driver" value={product.driverConfiguration} />}
                  {product.driverSize && <SpecItem label="Kích thước driver" value={product.driverSize} />}
                  {product.enclosureType && <SpecItem label="Kiểu vỏ" value={product.enclosureType} />}
                  {product.crossoverFrequency && <SpecItem label="Tần số crossover" value={product.crossoverFrequency} />}
                  {product.placementType && <SpecItem label="Vị trí đặt" value={translatePlacementType(product.placementType)} />}
                  
                  {/* Headphone specs */}
                  {product.headphoneType && <SpecItem label="Loại tai nghe" value={product.headphoneType} />}
                  {product.batteryCapacity && <SpecItem label="Pin" value={product.batteryCapacity} />}
                  {product.headphoneFeatures && <SpecItem label="Tính năng" value={product.headphoneFeatures} />}
                  
                  {/* Amplifier specs */}
                  {product.amplifierType && <SpecItem label="Loại ampli" value={product.amplifierType} />}
                  {product.totalPowerOutput && <SpecItem label="Công suất tổng" value={product.totalPowerOutput} />}
                  {product.thd && <SpecItem label="THD" value={product.thd} />}
                  {product.snr && <SpecItem label="SNR" value={product.snr} />}
                  
                  {/* DAC specs */}
                  {product.dacChipset && <SpecItem label="Chipset DAC" value={product.dacChipset} />}
                  {product.sampleRate && <SpecItem label="Sample rate" value={product.sampleRate} />}
                  {product.bitDepth && <SpecItem label="Bit depth" value={product.bitDepth} />}
                  {product.inputInterface && <SpecItem label="Input" value={product.inputInterface} />}
                  {product.outputInterface && <SpecItem label="Output" value={product.outputInterface} />}
                </div>
              </div>

              {/* Warranty & Manufacturer */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-orange-600" />
                  Bảo hành & Nhà sản xuất
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Thời gian bảo hành" value={product.warrantyPeriod} />
                  <InfoRow label="Loại bảo hành" value={product.warrantyType} />
                  <InfoRow label="Nhà sản xuất" value={product.manufacturerName} />
                  <InfoRow label="Địa chỉ NSX" value={product.manufacturerAddress} />
                </div>
              </div>

              {/* Store & Metadata */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-orange-600" />
                  Thông tin cửa hàng & Metadata
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Cửa hàng" value={product.storeName} />
                  <InfoRow label="ID cửa hàng" value={product.storeId} valueClassName="font-mono text-xs" />
                  <InfoRow label="Sản phẩm nổi bật" value={product.isFeatured ? 'Có' : 'Không'} />
                  {product.ratingAverage && <InfoRow label="Đánh giá TB" value={`${product.ratingAverage} ⭐`} />}
                  {product.reviewCount && <InfoRow label="Số đánh giá" value={product.reviewCount} />}
                  {product.viewCount && <InfoRow label="Lượt xem" value={product.viewCount} />}
                  <InfoRow label="Ngày tạo" value={ProductService.formatDate(product.createdAt)} />
                  {product.updatedAt && <InfoRow label="Cập nhật lần cuối" value={ProductService.formatDate(product.updatedAt)} />}
                  <InfoRow label="Người tạo" value={product.createdBy} valueClassName="font-mono text-xs" />
                  {product.updatedBy && <InfoRow label="Người cập nhật" value={product.updatedBy} valueClassName="font-mono text-xs" />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Helper component for info rows - Memoized
const InfoRow: React.FC<{ 
  label: string; 
  value: React.ReactNode; 
  valueClassName?: string;
}> = React.memo(({ label, value, valueClassName = '' }) => {
  if (value === null || value === undefined || value === '') return null;
  
  return (
    <div className="flex items-start border-b border-gray-100 pb-2">
      <span className="text-sm text-gray-600 w-1/3 flex-shrink-0">{label}:</span>
      <span className={`text-sm text-gray-900 flex-1 ${valueClassName}`}>
        {typeof value === 'string' || typeof value === 'number' ? value : value}
      </span>
    </div>
  );
});

InfoRow.displayName = 'InfoRow';

// Helper component for technical specs - Memoized
const SpecItem: React.FC<{ label: string; value: string | number }> = React.memo(({ label, value }) => {
  return (
    <div className="bg-gray-50 p-2 rounded">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
});

SpecItem.displayName = 'SpecItem';

export default React.memo(ProductDetailDrawer);
