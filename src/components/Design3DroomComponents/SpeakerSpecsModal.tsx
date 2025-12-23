import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CustomSpeakerSpecs } from './index';
import { CustomerCategoryService } from '../../services/customer/CategoryService';
import { ProductListService } from '../../services/customer/ProductListService';
import type { CategoryTreeNode } from '../../types/api';

interface SimilarProductSummary {
  productId: string;
  name: string;
  imageUrl: string;
}

interface SpeakerSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: CustomSpeakerSpecs;
  speakerName?: string;
}

const SpeakerSpecsModal: React.FC<SpeakerSpecsModalProps> = ({
  isOpen,
  onClose,
  specs,
  speakerName = 'Loa tùy chỉnh'
}) => {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [topN, setTopN] = useState<number>(10);
  const [isSearching, setIsSearching] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<SimilarProductSummary[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch categories khi modal mở và reset states
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        setIsLoadingCategories(true);
        try {
          const response = await CustomerCategoryService.getCategoryTree();
          if (response.data) {
            setCategories(response.data);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setIsLoadingCategories(false);
        }
      };
      fetchCategories();
    } else {
      // Reset states khi modal đóng
      setSimilarProducts(null);
      setSearchError(null);
      setIsSearching(false);
    }
  }, [isOpen]);

  // JSON payload cho API /products/similar/spec sẽ được build trực tiếp trong handler, không cần memo riêng

  // Handler để tìm sản phẩm tương tự
  const handleFindSimilarProducts = async () => {
    setIsSearching(true);
    setSearchError(null);
    setSimilarProducts(null);

    try {
      const requestBody = {
        categoryId: selectedCategoryId || null,
        topN: topN,
        thongSoKyThuat: {
          daiTanSo: {
            tanSoThap: `${specs.frequencyLow}`,
            tanSoCao: `${specs.frequencyHigh}`
          },
          congSuat: `${specs.power}`,
          troKhang: `${specs.impedance}`,
          doNhay: `${specs.sensitivity}`,
          doMeoTieng: `${specs.thd}`,
          tanSoCrossover: specs.crossoverFrequency ? `${specs.crossoverFrequency}` : null
        }
      };

      const response = await ProductListService.findSimilarProductsBySpecs(requestBody);
      const productIds = response.data?.productIds || [];

      if (productIds.length === 0) {
        setSimilarProducts([]);
      } else {
        // Fetch chi tiết từng sản phẩm để lấy tên + hình ảnh
        const products = await Promise.all(
          productIds.map(async (productId) => {
            try {
              const detail = await ProductListService.getProductById(productId);
              const product = detail.data;
              const imageUrl =
                (product.images && product.images[0]) ||
                '/images/placeholder-product.png';

              return {
                productId: product.productId,
                name: product.name,
                imageUrl,
              } as SimilarProductSummary;
            } catch (error) {
              console.error('Error fetching product detail for similar product:', productId, error);
              return null;
            }
          })
        );

        const validProducts = products.filter(
          (p): p is SimilarProductSummary => p !== null
        );
        setSimilarProducts(validProducts);
      }
    } catch (error: any) {
      console.error('Error finding similar products:', error);
      setSearchError(error?.message || 'Không thể tìm sản phẩm tương tự. Vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
  };

  // Conditional rendering thay vì early return để đảm bảo hooks luôn được gọi
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-50">
          <h2 className="text-xl font-semibold text-gray-800">📊 Thông số kỹ thuật loa</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Speaker Name */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">🔊 Tên loa</h3>
              <p className="text-gray-800 font-medium">{speakerName}</p>
            </div>

            {/* Category Selection */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">🎵 Loại thiết bị âm thanh</h3>
              {isLoadingCategories ? (
                <div className="text-sm text-gray-600">Đang tải danh sách...</div>
              ) : (
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-indigo-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Chọn loại thiết bị --</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {selectedCategoryId && (
                <p className="text-xs text-indigo-700 mt-2">
                  Đã chọn: <span className="font-semibold">{categories.find(cat => cat.categoryId === selectedCategoryId)?.name}</span>
                </p>
              )}
            </div>

            {/* Frequency Response */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📡 Dải tần số (Frequency Response)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Tần số thấp (Bass):</span>
                  <span className="font-semibold text-blue-700">{specs.frequencyLow} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tần số cao (Treble):</span>
                  <span className="font-semibold text-blue-700">{specs.frequencyHigh} Hz</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="text-gray-700 font-medium">Dải tần số:</span>
                  <span className="font-bold text-blue-800">{specs.frequencyLow}Hz - {specs.frequencyHigh}Hz</span>
                </div>
              </div>
            </div>

            {/* Power */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3">⚡ Công suất (Power)</h3>
              <div className="text-2xl font-bold text-green-700">{specs.power}W</div>
              <p className="text-xs text-gray-600 mt-1">Công suất định mức</p>
            </div>

            {/* Impedance */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">🔌 Trở kháng (Impedance)</h3>
              <div className="text-2xl font-bold text-purple-700">{specs.impedance}Ω</div>
              <p className="text-xs text-gray-600 mt-1">Trở kháng danh định</p>
            </div>

            {/* Sensitivity */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">🎯 Độ nhạy (Sensitivity)</h3>
              <div className="text-2xl font-bold text-yellow-700">{specs.sensitivity} dB/W/m</div>
              <p className="text-xs text-gray-600 mt-1">Độ nhạy âm thanh</p>
            </div>

            {/* EQ Adjustments */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">🎚️ Điều chỉnh EQ (dB)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Bass:</span>
                  <span className={`font-semibold ${specs.bassBoost > 0 ? 'text-green-600' : specs.bassBoost < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {specs.bassBoost > 0 ? '+' : ''}{specs.bassBoost} dB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Mid:</span>
                  <span className={`font-semibold ${specs.midBoost > 0 ? 'text-green-600' : specs.midBoost < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {specs.midBoost > 0 ? '+' : ''}{specs.midBoost} dB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Treble:</span>
                  <span className={`font-semibold ${specs.trebleBoost > 0 ? 'text-green-600' : specs.trebleBoost < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {specs.trebleBoost > 0 ? '+' : ''}{specs.trebleBoost} dB
                  </span>
                </div>
              </div>
            </div>

            {/* THD */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-3">📉 Độ méo tiếng (THD)</h3>
              <div className="text-2xl font-bold text-red-700">{specs.thd}%</div>
              <p className="text-xs text-gray-600 mt-1">Total Harmonic Distortion</p>
            </div>

            {/* Crossover Frequency */}
            {specs.crossoverFrequency && (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">🔀 Tần số Crossover</h3>
                <div className="text-2xl font-bold text-indigo-700">{specs.crossoverFrequency} Hz</div>
                <p className="text-xs text-gray-600 mt-1">Tần số phân tách cho loa đa driver</p>
              </div>
            )}

            {/* Find Similar Products Section - Đưa xuống cuối */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">🔍 Tìm sản phẩm tương tự</h3>
              
              {/* TopN Selection */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng sản phẩm muốn tìm:
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      onClick={() => setTopN(num)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                        topN === num
                          ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                          : 'bg-white text-gray-700 border-purple-300 hover:border-purple-400'
                      }`}
                    >
                      {num} sản phẩm
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleFindSimilarProducts}
                disabled={isSearching}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang tìm kiếm...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Tìm sản phẩm tương tự</span>
                  </>
                )}
              </button>

              {/* Search Results */}
              {searchError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{searchError}</p>
                </div>
              )}

              {similarProducts && (
                <div className="mt-3 p-3 bg-white border border-purple-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">Kết quả tìm kiếm:</h4>
                  {similarProducts.length === 0 ? (
                    <p className="text-sm text-gray-600">Không tìm thấy sản phẩm tương tự.</p>
                  ) : (
                    <div className="space-y-2">
                      {similarProducts.map((product) => (
                        <button
                          key={product.productId}
                          onClick={() => {
                            navigate(`/product/${product.productId}`);
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder-product.png';
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900 line-clamp-2">
                              {product.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* JSON Preview - Ẩn khỏi UI theo yêu cầu */}
          </div>
        </div>

        {/* Footer - chỉ giữ nút Đóng */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakerSpecsModal;

