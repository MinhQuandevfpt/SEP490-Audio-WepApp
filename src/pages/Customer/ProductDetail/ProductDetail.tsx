import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { ProductListService, type Product } from '../../../services/customer/ProductListService';
import { ProductViewService, type ProductVoucherItem } from '../../../services/customer/ProductViewService';
import ImageGallery from '../../../components/ProductDetailComponents/ImageGallery';
import StoreInfo from '../../../components/ProductDetailComponents/StoreInfo';
import TitlePrice from '../../../components/ProductDetailComponents/TitlePrice';
import PurchaseActions from '../../../components/ProductDetailComponents/PurchaseActions';
import ProductTabs from '../../../components/ProductDetailComponents/tabs/ProductTabs';
import InfoCard from '../../../components/ProductDetailComponents/info/InfoCard';
import ProductVouchers from '../../../components/ProductDetailComponents/ProductVouchers';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<ProductVoucherItem[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  useEffect(() => {
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (id) {
      fetchProductDetail(id);
      fetchVouchers(id);
    }
  }, [id]);

  const fetchProductDetail = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ProductListService.getProductById(productId);
      
      if (response && response.data) {
        setProduct(response.data);
      }
    } catch (err) {
      console.error('Error loading product detail:', err);
      setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async (productId: string) => {
    try {
      setVouchersLoading(true);
      const res = await ProductViewService.getProductVouchers(productId);
      const list = res?.data?.vouchers?.shop || [];
      setVouchers(list);
    } catch (e) {
      
      console.warn('Không thể tải voucher sản phẩm:', e);
      setVouchers([]);
    } finally {
      setVouchersLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <div className="animate-pulse bg-gray-200 aspect-square rounded-lg"></div>
            </div>
            <div className="lg:col-span-6 space-y-4">
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Không tìm thấy sản phẩm'}
            </h2>
            <button
              onClick={() => window.history.back()}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Quay lại
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/images/placeholder-product.png'];

  const specs = [
    { key: 'Danh mục', value: product.categoryName },
    { key: 'Thương hiệu', value: product.brandName },
    { key: 'Model', value: product.model || 'N/A' },
    { key: 'Màu sắc', value: product.color || 'N/A' },
    { key: 'Chất liệu', value: product.material || 'N/A' },
    { key: 'Kích thước', value: product.dimensions || 'N/A' },
    { key: 'Trọng lượng', value: product.weight ? `${product.weight} kg` : 'N/A' },
    { key: 'SKU', value: product.sku || 'N/A' },
    ...(product.frequencyResponse ? [{ key: 'Dải tần số', value: product.frequencyResponse }] : []),
    ...(product.sensitivity ? [{ key: 'Độ nhạy', value: product.sensitivity }] : []),
    ...(product.impedance ? [{ key: 'Trở kháng', value: product.impedance }] : []),
    ...(product.connectionType ? [{ key: 'Kết nối', value: product.connectionType }] : []),
    ...(product.warrantyPeriod ? [{ key: 'Bảo hành', value: product.warrantyPeriod }] : []),
  ];


  const colors = product.color ? [{
    name: product.color,
    hex: '#cccccc' 
  }] : undefined;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
     
          <div className="lg:col-span-5">
            <ImageGallery images={images} />
          </div>

          
          <div className="lg:col-span-7 space-y-4">
            <TitlePrice 
              name={product.name}
              brand={product.brandName}
              rating={product.ratingAverage || 0}
              reviewsCount={product.reviewCount || 0}
              soldCount={0} // API doesn't provide this
              price={product.price}
              salePrice={product.discountPrice || undefined}
              shortDescription={product.shortDescription}
            />
       
            {!vouchersLoading && vouchers.length > 0 && (
              <ProductVouchers vouchers={vouchers} />
            )}
            <PurchaseActions 
              productId={product.productId}
              productName={product.name}
              productImage={images[0]}
              productPrice={product.discountPrice || product.price}
              inStock={product.stockQuantity > 0} 
              colors={colors} 
            />
          </div>
        </div>

       
        <StoreInfo 
          storeId={product.storeId}
          storeName={product.storeName}
          storeAvatar={undefined} 
        />

       
        <ProductTabs 
          description={product.description ? [product.description] : []} 
          specs={specs}
        />

      
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard 
            icon={<span>🛠️</span>} 
            title={`Bảo hành ${product.warrantyPeriod || '12 tháng'}`}
            desc={product.warrantyType || 'Bảo hành chính hãng'} 
          />
          <InfoCard 
            icon={<span>🚚</span>} 
            title="Giao hàng toàn quốc" 
            desc={product.shippingFee ? `Phí ship: ${product.shippingFee.toLocaleString('vi-VN')}đ` : 'Miễn phí đơn từ 500k'} 
          />
          <InfoCard 
            icon={<span>💰</span>} 
            title="Đổi trả 7 ngày" 
            desc="Nếu sản phẩm lỗi kỹ thuật" 
          />
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;


