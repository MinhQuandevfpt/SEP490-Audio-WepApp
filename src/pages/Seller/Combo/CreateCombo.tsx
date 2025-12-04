import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SaveOutlined,
  ReloadOutlined,
  InboxOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { ComboService } from '../../../services/seller/ComboService';
import { ProductService } from '../../../services/seller/ProductService';
import { StoreService } from '../../../services/seller/StoreService';
import { FileUploadService } from '../../../services/FileUploadService';
import { showSuccess, showError, showWarning } from '../../../utils/notification';
import type { CreateComboRequest, ComboItem, Product, StoreInfo } from '../../../types/seller';

interface ComboFormData {
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  videoUrl: string;
  items: ComboItem[];
}

const CreateCombo: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<ComboFormData>({
    name: '',
    shortDescription: '',
    description: '',
    images: [],
    videoUrl: '',
    items: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [storeContextLoading, setStoreContextLoading] = useState(true);
  const [storeContextError, setStoreContextError] = useState<string | null>(null);
  
  // Product selection
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductsMap, setSelectedProductsMap] = useState<Map<string, Product>>(new Map());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const resolveStoreContext = useCallback(async () => {
    try {
      setStoreContextLoading(true);
      setStoreContextError(null);

      let storeInfo: StoreInfo | null = null;
      try {
        storeInfo = await StoreService.getStoreInfo();
      } catch (infoError) {
        // Silent fallback
      }

      let derivedStoreId =
        storeInfo?.id ||
        localStorage.getItem('seller_store_id') ||
        localStorage.getItem('storeId') ||
        '';

      if (!derivedStoreId) {
        derivedStoreId = await StoreService.getStoreId();
      }

      if (!derivedStoreId) {
        throw new Error('Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.');
      }

      setStoreId(derivedStoreId);

      const cachedAccountId = localStorage.getItem('accountId');
      const derivedCreatorId =
        cachedAccountId ||
        (storeInfo as any)?.accountId ||
        derivedStoreId;

      setCreatorId(derivedCreatorId);
    } catch (error: any) {
      setStoreContextError(error?.message || 'Không thể tải thông tin cửa hàng');
    } finally {
      setStoreContextLoading(false);
    }
  }, []);

  useEffect(() => {
    resolveStoreContext();
  }, [resolveStoreContext]);

  // Load products
  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoadingProducts(true);
      const response = await ProductService.getProducts({
        storeId,
        keyword: searchKeyword,
        status: 'ACTIVE',
        page: 0,
        size: 100,
      });
      setProducts(response.data.content);
    } catch (error) {
      // Silent error
    } finally {
      setLoadingProducts(false);
    }
  }, [storeId, searchKeyword]);

  useEffect(() => {
    if (showProductModal && storeId) {
      loadProducts();
    }
  }, [showProductModal, storeId, loadProducts]);

  const handleInputChange = (field: keyof ComboFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.images.length + files.length > 9) {
      showWarning('Chỉ được tải tối đa 9 ảnh', 'Giới hạn ảnh');
      return;
    }

    try {
      setUploadingImage(true);
      const uploadPromises = Array.from(files).map(file => FileUploadService.uploadImage(file));
      const responses = await Promise.all(uploadPromises);
      const newImageUrls = responses.map(res => res.url);
      
      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls].slice(0, 9),
      }));
    } catch (error: any) {
      showError(error?.message || 'Không thể tải ảnh lên', 'Lỗi tải ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video/mp4')) {
      showWarning('Chỉ hỗ trợ định dạng video MP4', 'Định dạng không hợp lệ');
      return;
    }

    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      showWarning('Dung lượng video không được vượt quá 30MB', 'File quá lớn');
      return;
    }

    try {
      setUploadingVideo(true);
      const response = await FileUploadService.uploadVideo(file);
      setForm(prev => ({ ...prev, videoUrl: response.url }));
    } catch (error: any) {
      showError(error?.message || 'Không thể tải video lên', 'Lỗi tải video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleToggleProduct = (product: Product, variantId?: string) => {
    const itemKey = variantId ? `${product.productId}_${variantId}` : product.productId;
    const existingItem = form.items.find(item => {
      if (variantId) {
        return item.productId === product.productId && item.variantId === variantId;
      }
      return item.productId === product.productId && !item.variantId;
    });
    
    if (existingItem) {
      // Remove product if already selected
      handleRemoveProduct(product.productId, variantId);
    } else {
      // Add new product/variant with full details
      const variant = variantId ? product.variants.find(v => v.variantId === variantId) : null;
      const newItem: ComboItem = {
        productId: product.productId,
        productName: product.name,
        quantity: 1,
      };
      
      // Add variant details ONLY if variant exists
      if (variant && variantId) {
        newItem.variantId = variantId;
        newItem.variantName = `${variant.optionName}: ${variant.optionValue}`;
        newItem.optionName = variant.optionName;
        newItem.optionValue = variant.optionValue;
        newItem.variantPrice = variant.variantPrice;
        newItem.variantStock = variant.variantStock;
        newItem.variantUrl = variant.variantUrl;
        newItem.variantSku = variant.variantSku;
      }
      // For products without variants, don't set any variant fields
      
      setForm(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setSelectedProductsMap(prev => new Map(prev).set(itemKey, product));
    }
  };

  const handleIncreaseQuantity = (productId: string, variantId: string | undefined, currentQuantity: number, maxStock: number) => {
    if (currentQuantity >= maxStock) return;
    handleUpdateQuantity(productId, variantId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (productId: string, variantId: string | undefined, currentQuantity: number) => {
    if (currentQuantity <= 1) return;
    handleUpdateQuantity(productId, variantId, currentQuantity - 1);
  };

  const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity < 1) return;
    
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (variantId) {
          return item.productId === productId && item.variantId === variantId
            ? { ...item, quantity }
            : item;
        }
        return item.productId === productId && !item.variantId
          ? { ...item, quantity }
          : item;
      }),
    }));
  };

  const handleRemoveProduct = (productId: string, variantId?: string) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(item => {
        if (variantId) {
          return !(item.productId === productId && item.variantId === variantId);
        }
        return !(item.productId === productId && !item.variantId);
      }),
    }));
    
    const itemKey = variantId ? `${productId}_${variantId}` : productId;
    setSelectedProductsMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemKey);
      return newMap;
    });
  };

  const validateForm = (): string | null => {
    if (!storeId) return 'Không tìm thấy thông tin cửa hàng';
    if (!form.name.trim()) return 'Tên combo không được để trống';
    if (form.name.trim().length < 10) return 'Tên combo phải có ít nhất 10 ký tự';
    if (form.name.trim().length > 100) return 'Tên combo không được vượt quá 100 ký tự';
    if (!form.description.trim()) return 'Mô tả chi tiết không được để trống';
    if (form.description.trim().length > 5000) return 'Mô tả chi tiết không được vượt quá 5000 ký tự';
    if (form.images.length === 0) return 'Vui lòng tải lên ít nhất 1 ảnh';
    if (form.items.length < 2) return 'Combo phải có ít nhất 2 sản phẩm';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeId) {
      showError('Không tìm thấy thông tin cửa hàng. Vui lòng thử lại sau.', 'Lỗi hệ thống');
      return;
    }

    const error = validateForm();
    if (error) {
      showWarning(error, 'Vui lòng kiểm tra lại');
      return;
    }

    try {
      setLoading(true);

      // Clean items: BE requires all variant fields even for non-variant products
      const cleanedItems = form.items.map(item => {
        if (item.variantId) {
          // Product HAS variant - include all variant fields
          const cleanItem: any = {
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            optionName: item.optionName,
            optionValue: item.optionValue,
            variantPrice: item.variantPrice,
            variantStock: item.variantStock,
            variantUrl: item.variantUrl,
            variantSku: item.variantSku,
            quantity: item.quantity,
          };
          // Remove undefined fields
          Object.keys(cleanItem).forEach(key => {
            if (cleanItem[key] === undefined) {
              delete cleanItem[key];
            }
          });
          return cleanItem;
        } else {
          // Product NO variant - Send empty strings for BE compatibility
          // BE bug: requires option_name/value even when variantId is null
          return {
            productId: item.productId,
            productName: item.productName,
            variantId: null,
            optionName: "", // Empty string instead of omitting
            optionValue: "", // Empty string instead of omitting
            variantPrice: 0,
            variantStock: 0,
            variantUrl: "",
            variantSku: "",
            quantity: item.quantity,
          };
        }
      });

      const request: CreateComboRequest = {
        storeId,
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim() || form.shortDescription.trim(),
        images: form.images,
        videoUrl: form.videoUrl || undefined,
        weight: 0,
        stockQuantity: 0,
        shippingAddress: '',
        warehouseLocation: '',
        provinceCode: '',
        districtCode: '',
        wardCode: '',
        items: cleanedItems as ComboItem[],
        createdBy: creatorId || storeId,
      };

      await ComboService.createCombo(request);
      
      showSuccess('Tạo combo thành công!', 'Thành công');
      navigate('/seller/dashboard/combos');
    } catch (error: any) {
      let errorMessage = 'Có lỗi xảy ra khi tạo combo';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showError(errorMessage, 'Tạo combo thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (storeContextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        <p className="text-gray-600 text-sm">Đang tải thông tin cửa hàng...</p>
      </div>
    );
  }

  if (storeContextError) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center space-y-4">
          <p className="text-red-600 font-semibold">{storeContextError}</p>
          <button
            onClick={resolveStoreContext}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ReloadOutlined className="animate-spin" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <InboxOutlined className="text-2xl text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tạo Combo Mới</h1>
                <p className="text-sm text-gray-500">Gộp nhiều sản phẩm thành combo ưu đãi</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Tên combo
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="VD: Combo loa + mic thu âm chuyên nghiệp"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{form.name.length}/100 ký tự (tối thiểu 10 ký tự)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả ngắn
              </label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Mô tả ngắn gọn về combo"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{form.shortDescription.length}/200 ký tự</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Mô tả chi tiết
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Mô tả chi tiết về combo, lợi ích khi mua combo..."
                maxLength={5000}
              />
              <p className="text-xs text-gray-500 mt-1">{form.description.length}/5000 ký tự</p>
            </div>
          </div>

          {/* Hình ảnh & Video */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Hình ảnh & Video</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Hình ảnh (Tối đa 9 ảnh)
              </label>
              
              <div className="grid grid-cols-5 gap-4">
                {form.images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg border-2 border-gray-200 overflow-hidden group">
                    <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CloseOutlined style={{ fontSize: '12px' }} />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded">
                        Ảnh đại diện
                      </div>
                    )}
                  </div>
                ))}
                
                {form.images.length < 9 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    ) : (
                      <>
                        <PictureOutlined className="text-3xl text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Thêm ảnh</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video giới thiệu (MP4, tối đa 30MB)
              </label>
              
              {form.videoUrl ? (
                <div className="relative">
                  <video src={form.videoUrl} controls className="w-full max-h-80 rounded-lg" />
                  <button
                    type="button"
                    onClick={() => handleInputChange('videoUrl', '')}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:border-orange-500 transition-colors">
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploadingVideo}
                  />
                  {uploadingVideo ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  ) : (
                    <>
                      <VideoCameraOutlined className="text-5xl text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Nhấn để tải video lên</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Sản phẩm trong combo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <span className="text-red-500">*</span> Sản phẩm trong combo
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Combo hiện có: <span className="font-semibold text-orange-600">{form.items.length}</span> mặt hàng
                  {form.items.length < 2 && <span className="text-red-500 ml-1">(Tối thiểu 2 mặt hàng)</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <PlusOutlined />
                Thêm sản phẩm
              </button>
            </div>

            {form.items.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <InboxOutlined className="text-5xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Chưa có sản phẩm nào trong combo</p>
                <p className="text-sm text-gray-400 mt-1">Nhấn "Thêm sản phẩm" để chọn</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group items by productId for better visualization */}
                {(() => {
                  // Group items by productId
                  const groupedItems = form.items.reduce((acc, item) => {
                    if (!acc[item.productId]) {
                      acc[item.productId] = [];
                    }
                    acc[item.productId].push(item);
                    return acc;
                  }, {} as Record<string, typeof form.items>);

                  return Object.entries(groupedItems).map(([productId, items]) => {
                    const firstItem = items[0];
                    const itemKey = firstItem.variantId ? `${firstItem.productId}_${firstItem.variantId}` : firstItem.productId;
                    const product = selectedProductsMap.get(itemKey);
                    if (!product) return null;

                    return (
                      <div key={productId} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                        {/* Product Header */}
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {items.length}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{product.name}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {items.length === 1 ? '1 mặt hàng' : `${items.length} mặt hàng (các phân loại)`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="divide-y divide-gray-200">
                          {items.map((item, index) => {
                            const itemKey = item.variantId ? `${item.productId}_${item.variantId}` : item.productId;
                            const product = selectedProductsMap.get(itemKey);
                            if (!product) return null;

                            const variant = item.variantId 
                              ? product.variants.find(v => v.variantId === item.variantId)
                              : null;
                            
                            const displayPrice = variant ? variant.variantPrice : product.price;
                            const displayStock = variant ? variant.variantStock : product.stockQuantity;
                            const displayImage = variant?.variantUrl || product.images[0] || '/placeholder.png';
                            const displaySku = variant?.variantSku || product.sku;

                            return (
                              <div key={itemKey} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                  {/* Item Number Badge */}
                                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-semibold text-orange-700">{index + 1}</span>
                                  </div>

                                  {/* Image */}
                                  <img
                                    src={displayImage}
                                    alt={variant ? `${product.name} - ${variant.optionValue}` : product.name}
                                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                  />

                                  {/* Item Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2">
                                      <h5 className="font-medium text-gray-900">
                                        {variant ? (
                                          <>
                                            <span className="text-orange-600">Phân loại:</span> {variant.optionName} - {variant.optionValue}
                                          </>
                                        ) : (
                                          <span className="text-blue-600">Sản phẩm đơn</span>
                                        )}
                                      </h5>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mt-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">SKU:</span>
                                        <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                          {displaySku}
                                        </span>
                                      </div>
                                      <div className="h-4 w-px bg-gray-300"></div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Giá:</span>
                                        <span className="text-base font-bold text-orange-600">
                                          {displayPrice.toLocaleString('vi-VN')}đ
                                        </span>
                                      </div>
                                      <div className="h-4 w-px bg-gray-300"></div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Tồn kho:</span>
                                        <span className={`text-sm font-semibold ${displayStock > 10 ? 'text-green-600' : 'text-red-600'}`}>
                                          {displayStock} sản phẩm
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDecreaseQuantity(item.productId, item.variantId, item.quantity)}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={item.quantity <= 1}
                                      >
                                        −
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        max={displayStock}
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 1;
                                          if (val >= 1 && val <= displayStock) {
                                            handleUpdateQuantity(item.productId, item.variantId, val);
                                          }
                                        }}
                                        className="w-16 px-2 py-2 border-2 border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleIncreaseQuantity(item.productId, item.variantId, item.quantity, displayStock)}
                                        className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={item.quantity >= displayStock}
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProduct(item.productId, item.variantId)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                                      title="Xóa mặt hàng này"
                                    >
                                      <DeleteOutlined className="text-lg group-hover:scale-110 transition-transform" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>


          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard/combos')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <SaveOutlined />
                  Tạo Combo
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Chọn sản phẩm</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Combo hiện có: <span className="font-semibold text-orange-600">{form.items.length}</span> mặt hàng
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingProducts ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <InboxOutlined className="text-6xl text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Không tìm thấy sản phẩm</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => {
                    const hasVariants = product.variants && product.variants.length > 0;
                    const isExpanded = expandedProducts.has(product.productId);
                    
                    // Check if any variant is selected
                    const selectedVariantsCount = hasVariants 
                      ? form.items.filter(item => item.productId === product.productId && item.variantId).length
                      : 0;
                    
                    // Check if product itself is selected (no variants)
                    const isProductSelected = !hasVariants && form.items.some(
                      item => item.productId === product.productId && !item.variantId
                    );
                    
                    return (
                      <div key={product.productId} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Parent Product Row */}
                        <div className={`flex items-center gap-3 p-4 ${isExpanded ? 'bg-gray-50' : 'bg-white'} transition-colors`}>
                          <img
                            src={product.images[0] || '/placeholder.png'}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            {!hasVariants && (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-orange-600 font-semibold">
                                  {product.price.toLocaleString('vi-VN')}đ
                                </p>
                                <p className="text-xs text-gray-500">
                                  Kho: {product.stockQuantity}
                                </p>
                              </div>
                            )}
                            {hasVariants && (
                              <p className="text-xs text-blue-600 mt-1">
                                {product.variants.length} phân loại
                                {selectedVariantsCount > 0 && ` • ${selectedVariantsCount} đã chọn`}
                              </p>
                            )}
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-3">
                            {hasVariants ? (
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={isExpanded}
                                  onChange={() => {
                                    setExpandedProducts(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(product.productId)) {
                                        newSet.delete(product.productId);
                                      } else {
                                        newSet.add(product.productId);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="w-5 h-5 rounded border-2 border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                                  {isExpanded ? 'Thu gọn phân loại' : 'Xem phân loại'}
                                </span>
                              </label>
                            ) : (
                              <>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isProductSelected}
                                    onChange={() => handleToggleProduct(product)}
                                    className="w-5 h-5 rounded border-2 border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                  />
                                  <span className="text-sm font-medium text-gray-700">Chọn</span>
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDecreaseQuantity(product.productId, undefined, form.items.find(item => item.productId === product.productId)?.quantity || 1)}
                                    disabled={!isProductSelected}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    -
                                  </button>
                                  <span className="w-10 text-center font-semibold">
                                    {form.items.find(item => item.productId === product.productId)?.quantity || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleIncreaseQuantity(product.productId, undefined, form.items.find(item => item.productId === product.productId)?.quantity || 1, product.stockQuantity)}
                                    disabled={!isProductSelected}
                                    className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 rounded text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    +
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Variants List (Children) */}
                        {hasVariants && isExpanded && (
                          <div className="bg-orange-50 border-t border-gray-200">
                            <div className="p-4 space-y-2">
                              <p className="text-sm font-medium text-gray-700 mb-3">Chọn phân loại:</p>
                              {product.variants.map((variant) => {
                                const selectedItem = form.items.find(
                                  item => item.productId === product.productId && item.variantId === variant.variantId
                                );
                                const isSelected = !!selectedItem;
                                
                                return (
                                  <div
                                    key={variant.variantId}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      isSelected
                                        ? 'border-orange-500 bg-white'
                                        : 'border-gray-200 bg-white hover:border-orange-300'
                                    }`}
                                  >
                                    <img
                                      src={variant.variantUrl || product.images[0] || '/placeholder.png'}
                                      alt={variant.optionValue}
                                      className="w-12 h-12 object-cover rounded-lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">
                                        {variant.optionName}: {variant.optionValue}
                                      </p>
                                      <p className="text-xs text-gray-500">SKU: {variant.variantSku}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-orange-600 font-semibold">
                                          {variant.variantPrice.toLocaleString('vi-VN')}đ
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Kho: {variant.variantStock}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Variant action buttons */}
                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleToggleProduct(product, variant.variantId)}
                                          className="w-5 h-5 rounded border-2 border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Chọn</span>
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleDecreaseQuantity(product.productId, variant.variantId, selectedItem?.quantity || 1)}
                                          disabled={!isSelected}
                                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          -
                                        </button>
                                        <span className="w-10 text-center font-semibold">{selectedItem?.quantity || 1}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleIncreaseQuantity(product.productId, variant.variantId, selectedItem?.quantity || 1, variant.variantStock)}
                                          disabled={!isSelected}
                                          className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 rounded text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCombo;
