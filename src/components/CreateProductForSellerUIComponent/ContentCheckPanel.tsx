import React from 'react';

interface ContentCheckData {
  checks: {
    basic: {
      name: boolean;
      brandName: boolean;
      category: boolean;
      weight: boolean;
      specs: boolean;
      sku: boolean;
    };
    media: {
      images: boolean;
    };
    pricing: {
      hasValidPricing: boolean;
    };
  };
  basicComplete: boolean;
  mediaComplete: boolean;
  pricingComplete: boolean;
  specsCount: number;
  canSubmit: boolean;
}

interface ContentCheckPanelProps {
  contentCheck: ContentCheckData;
  showContentCheck: boolean;
  onToggle: () => void;
}

const ContentCheckPanel: React.FC<ContentCheckPanelProps> = ({
  contentCheck,
  showContentCheck,
  onToggle,
}) => {
  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <div className="sticky top-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Kiểm tra nội dung</h3>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                {showContentCheck ? '−' : '+'}
              </button>
            </div>
          </div>

          {showContentCheck && (
            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Thông tin bắt buộc</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.basic.name ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.basic.name ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      Tên sản phẩm
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.basic.brandName ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.basic.brandName ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      Thương hiệu
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.basic.category ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.basic.category ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      Danh mục
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.basic.weight ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.basic.weight ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      Cân nặng
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.basic.specs ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.basic.specs ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      Thông số kỹ thuật ({contentCheck.specsCount}/3)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.basic.sku ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.basic.sku ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      SKU sản phẩm
                    </span>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Hình ảnh</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.media.images ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.media.images ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      Hình ảnh sản phẩm
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Giá & Kho</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contentCheck.checks.pricing.hasValidPricing ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        contentCheck.checks.pricing.hasValidPricing
                          ? 'text-green-700'
                          : 'text-red-700'
                      }
                    >
                      Giá & Tồn kho
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 pl-3.5">
                    (Giá + Số lượng hoặc Phân loại đầy đủ)
                  </p>
                </div>
              </div>

              {/* Publish readiness */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Đăng sản phẩm:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contentCheck.canSubmit
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {contentCheck.canSubmit ? 'Sẵn sàng' : 'Cần hoàn thiện'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCheckPanel;
