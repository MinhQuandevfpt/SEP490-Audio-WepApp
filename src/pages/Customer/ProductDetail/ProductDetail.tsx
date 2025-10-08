import React from 'react';
import Layout from '../../../components/Layout';
import { loadProductDetail } from '../../../data/productdetail';
import ImageGallery from '../../../components/ProductDetailComponents/ImageGallery';
import TitlePrice from '../../../components/ProductDetailComponents/TitlePrice';
import PurchaseActions from '../../../components/ProductDetailComponents/PurchaseActions';
import ProductTabs from '../../../components/ProductDetailComponents/tabs/ProductTabs';
import InfoCard from '../../../components/ProductDetailComponents/info/InfoCard';

const ProductDetail: React.FC = () => {
  const product = loadProductDetail();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Big product image (with thumbnails below inside component) */}
          <div className="lg:col-span-6">
            <ImageGallery images={product.images} />
          </div>

          {/* Right: Title + Price + Short description + Actions (buy / cart / colors) */}
          <div className="lg:col-span-6 space-y-4">
            <TitlePrice 
              name={product.name}
              brand={product.brand}
              rating={product.rating}
              reviewsCount={product.reviewsCount}
              soldCount={product.soldCount}
              price={product.price}
              salePrice={product.salePrice}
              shortDescription={product.shortDescription}
            />
            <PurchaseActions inStock={product.inStock} colors={product.colors} />
          </div>
        </div>

        {/* Tabs: Description | Specs | Reviews */}
        <ProductTabs description={product.description} specs={product.specs} />

        {/* Bottom Info Cards: warranty + shipping + policy (3 columns) */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard icon={<span>🛠️</span>} title="Bảo hành 12 tháng" desc="Trung tâm chính hãng JBL" />
          <InfoCard icon={<span>🚚</span>} title="Giao nhanh 2h" desc="Miễn phí đơn từ 500k" />
          <InfoCard icon={<span>💰</span>} title="Đổi trả 7 ngày" desc="Nếu sản phẩm lỗi kỹ thuật" />
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;


