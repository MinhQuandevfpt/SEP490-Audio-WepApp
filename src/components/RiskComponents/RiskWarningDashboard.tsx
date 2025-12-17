import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { StoreService } from '../../services/seller/StoreService';
import type { RiskWarningResponse, DebtComponentItem, DebtComponentPage } from '../../types/seller';

const RiskWarningDashboard: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskWarningResponse | null>(null);
  const [debtItems, setDebtItems] = useState<DebtComponentItem[]>([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    from: '',
    to: '',
    orderCode: '',
    minAmount: '',
    maxAmount: '',
  });

  const [payableNowOnly, setPayableNowOnly] = useState(false);

  useEffect(() => {
    // Load lần đầu khi mở trang
    loadRiskData();
    loadDebtComponents();

    // Mỗi 2 phút tự động reload lại dữ liệu cảnh báo + breakdown
    const intervalId = window.setInterval(() => {
      console.log('⏰ Auto refresh RiskWarningDashboard (every 3 minutes)');
      loadRiskData();
      loadDebtComponents();
    }, 2 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StoreService.getRiskWarning();
      setRiskData(data);
    } catch (err: any) {
      console.error('Error loading risk data:', err);
      setError(err.message || 'Không thể tải thông tin cảnh báo nợ');
    } finally {
      setLoading(false);
    }
  };

  const loadDebtComponents = async () => {
    try {
      setDebtLoading(true);

      const { type, status, from, to, orderCode, minAmount, maxAmount } = filters;

      // Map UI filter -> API query
      let componentType: string | undefined;
      if (type === 'shipping_diff') componentType = 'SHIP_DIFF';
      else if (type === 'return_fee') componentType = 'RTO_FEE';
      else if (type === 'return_shipping') componentType = 'RETURN_SHIPPING_FEE';

      let apiStatus: string | undefined;
      if (status === 'paid') apiStatus = 'PAID';
      else if (status === 'unpaid') apiStatus = 'UNPAID';
      // 'pending' hoặc 'all' -> không filter theo status

      // Convert from/to (datetime-local) -> ISO string cho API
      let fromIso: string | undefined;
      let toIso: string | undefined;
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) {
          fromIso = d.toISOString();
        }
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) {
          toIso = d.toISOString();
        }
      }

      const pageData: DebtComponentPage = await StoreService.getDebtComponents({
        componentType,
        status: apiStatus,
        payableNowOnly,
        from: fromIso,
        to: toIso,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        orderCode: orderCode || undefined,
        page: 0,
        size: 20,
      });

      setDebtItems(pageData.content || []);
    } catch (err: any) {
      console.error('Error loading debt components:', err);
      // Giữ nguyên riskData, chỉ log lỗi breakdown để tránh làm hỏng toàn bộ dashboard
    } finally {
      setDebtLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    // Chỉ cần reload breakdown theo filter, risk summary vẫn giữ nguyên
    loadDebtComponents();
  };

  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      from: '',
      to: '',
      orderCode: '',
      minAmount: '',
      maxAmount: '',
    });
    setPayableNowOnly(false);
    loadDebtComponents();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Map warning level to Vietnamese text and color
  const getWarningLevelInfo = (level: string) => {
    switch (level) {
      case 'NONE':
        return {
          text: 'An toàn',
          description: 'Cửa hàng không có khoản nợ nào',
          emoji: '🟢',
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'NOTICE_20':
        return {
          text: 'Thông báo',
          description: 'Có nợ nhẹ, cần theo dõi',
          emoji: '🔵',
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        };
      case 'WARNING_50':
        return {
          text: 'Cảnh báo',
          description: 'Nợ đã đạt mức cảnh báo',
          emoji: '🟡',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        };
      case 'DANGER_80':
        return {
          text: 'Nguy hiểm',
          description: 'Nợ đã đạt mức nguy hiểm',
          emoji: '🟠',
          color: 'orange',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
        };
      case 'BLOCK_100':
        return {
          text: 'Vượt ngưỡng',
          description: 'Nợ vượt ngưỡng, cửa hàng bị khóa',
          emoji: '🔴',
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        };
      default:
        return {
          text: 'An toàn',
          description: 'Cửa hàng không có khoản nợ nào',
          emoji: '🟢',
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
    }
  };

  // Calculate risk percentage
  const calculateRiskPercentage = (): number => {
    if (!riskData || riskData.creditLimit === 0) return 0;
    if (riskData.effectiveDebt === 0) return 0;
    return Math.min(100, (riskData.effectiveDebt / riskData.creditLimit) * 100);
  };

  // Get risk bar color based on percentage and warning level
  const getRiskBarColor = (): string => {
    const percentage = calculateRiskPercentage();
    if (percentage === 0) return 'bg-gray-200';
    if (percentage < 20) return 'bg-gradient-to-r from-green-500 to-blue-500';
    if (percentage < 50) return 'bg-gradient-to-r from-blue-500 to-yellow-500';
    if (percentage < 80) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-orange-500 to-red-500';
  };

  // Get risk message based on warning level
  const getRiskMessage = (): string => {
    if (!riskData) return 'Đang tải thông tin...';
    
    if (riskData.warningLevel === 'NONE') {
      return 'Hiện tại cửa hàng không có khoản nợ nào. Không cần hiển thị cảnh báo.';
    }
    
    if (riskData.warningLevel === 'BLOCK_100') {
      return 'Cửa hàng đã vượt ngưỡng nợ cho phép và đã bị khóa. Vui lòng thanh toán các khoản nợ để mở khóa cửa hàng.';
    }
    
    const percentage = calculateRiskPercentage();
    if (percentage >= 80) {
      return 'Cửa hàng đang ở mức nguy hiểm. Vui lòng thanh toán các khoản nợ sớm để tránh bị khóa.';
    }
    if (percentage >= 50) {
      return 'Cửa hàng đang ở mức cảnh báo. Vui lòng theo dõi và thanh toán các khoản nợ.';
    }
    if (percentage >= 20) {
      return 'Cửa hàng có khoản nợ nhẹ. Vui lòng theo dõi tình hình.';
    }
    
    return 'Cửa hàng đang hoạt động bình thường.';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin cảnh báo nợ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!riskData) {
    return null;
  }

  const warningInfo = getWarningLevelInfo(riskData.warningLevel);
  const riskPercentage = calculateRiskPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Cảnh báo nợ cửa hàng
            </h1>
            <p className="text-sm text-gray-600">
              {riskData.storeName} • Dashboard quản lý nợ và rủi ro
            </p>
          </div>
          <div className={`${warningInfo.bgColor} ${warningInfo.textColor} px-4 py-2 rounded-full text-sm font-medium border ${warningInfo.borderColor}`}>
            {warningInfo.emoji} Mức cảnh báo: {warningInfo.text} • {warningInfo.description}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* LEFT: Summary Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt</h2>

            {/* Store Meta */}
            <div className="flex justify-end items-center text-sm text-gray-600 mb-5">
              <div className={`px-3 py-1 rounded-full border font-medium ${
                riskData.storeStatus === 'ACTIVE'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : riskData.storeStatus === 'SUSPENDED_DEBT'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                Trạng thái: {riskData.storeStatus === 'ACTIVE' ? 'Đang hoạt động' : 
                              riskData.storeStatus === 'SUSPENDED_DEBT' ? 'Bị khóa do nợ' : 
                              'Bị khóa vĩnh viễn'}
              </div>
            </div>

            {/* Summary Grid */}
            <div className="space-y-3 mb-6">
              {/* Hàng 1 – Tổng quan nợ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-xs text-gray-600 block mb-1">Tổng nợ hiện tại</span>
                  <div className="text-2xl font-bold text-orange-500 mb-1">
                    {formatCurrency(riskData.debtBalance)}
                  </div>
                  <small className="text-xs text-gray-500">
                    Bao gồm: nợ ship chênh lệch, phí quay đầu, phí return shipping
                  </small>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-xs text-gray-600 block mb-1">Hạn mức nợ</span>
                  <div className="text-2xl font-bold text-orange-500 mb-1">
                    {formatCurrency(riskData.creditLimit)}
                  </div>
                  <small className="text-xs text-gray-500">
                    = Tiền cọc ({formatCurrency(riskData.depositBalance)}) + Điểm uy tín ({riskData.legalPoint} × 100,000 VND)
                  </small>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-xs text-gray-600 block mb-1">Nợ đánh giá rủi ro</span>
                  <div className="text-2xl font-bold text-orange-500 mb-1">
                    {formatCurrency(riskData.effectiveDebt)}
                  </div>
                  <small className="text-xs text-gray-500">
                    Số nợ được dùng để tính toán mức độ rủi ro
                  </small>
                </div>
              </div>

              {/* Hàng 2 – Nợ cần thanh toán ngay (Action required) */}
              <div className="grid grid-cols-1">
                <div
                  className={`rounded-xl p-4 border ${
                    riskData.payableNowDebt > 0
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <span className="text-xs text-gray-600 block mb-1">
                    Nợ cần thanh toán ngay
                  </span>
                  <div
                    className={`text-2xl font-bold mb-1 ${
                      riskData.payableNowDebt > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(riskData.payableNowDebt)}
                  </div>
                  <small className="text-xs text-gray-500">
                    {riskData.payableNowDebt > 0
                      ? 'Số tiền đến hạn / quá hạn cần thanh toán ngay để đưa cửa hàng về trạng thái an toàn hơn.'
                      : 'Hiện tại không có khoản nợ nào đến hạn phải thanh toán ngay.'}
                  </small>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <strong className="text-gray-900">Mức độ rủi ro</strong>
                <span className="text-gray-500">
                  Cập nhật lúc: {formatDate(riskData.evaluatedAt)}
                </span>
              </div>

              {/* Risk Bar */}
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300 mb-2">
                <div
                  className={`h-full transition-all duration-300 ${getRiskBarColor()}`}
                  style={{ width: `${riskPercentage}%` }}
                />
              </div>

              {/* Risk Scale */}
              <div className="flex justify-between text-xs text-gray-500 mb-4">
                <span>0 VND</span>
                <span className="text-yellow-600 font-medium">
                  Cảnh báo: {formatCurrency(riskData.warningLine)}
                </span>
                <span className="text-orange-600 font-medium">
                  Nguy hiểm: {formatCurrency(riskData.criticalLine)}
                </span>
                <span className="text-red-600 font-medium">
                  Giới hạn: {formatCurrency(riskData.creditLimit)}
                </span>
              </div>

              {/* Risk Note */}
              <div className={`${warningInfo.bgColor} ${warningInfo.textColor} px-3 py-2 rounded-lg border ${warningInfo.borderColor} flex items-center gap-2 text-sm`}>
                {riskData.warningLevel === 'NONE' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : riskData.warningLevel === 'BLOCK_100' ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>{getRiskMessage()}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Filter Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Bộ lọc thành phần cấu thành nợ
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Dùng để tìm kiếm và lọc các khoản nợ chi tiết tạo ra tổng nợ hiện tại.
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                Ví dụ: nợ ship chênh lệch, phí quay đầu, phí return shipping...
              </span>
            </p>

            {/* Filter Group 1 */}
            <div className="grid grid-cols-1 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Loại khoản nợ</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="shipping_diff">Ship chênh lệch</option>
                  <option value="return_fee">Phí quay đầu</option>
                  <option value="return_shipping">Phí return shipping</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Đang chờ</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="unpaid">Chưa thanh toán</option>
                </select>
              </div>

            </div>

            {/* Filter Group 2 */}
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mã đơn hàng (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="VD: OD12345"
                  value={filters.orderCode}
                  onChange={(e) => handleFilterChange('orderCode', e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Từ ngày</label>
                  <input
                    type="datetime-local"
                    value={filters.from}
                    onChange={(e) => handleFilterChange('from', e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Đến ngày</label>
                  <input
                    type="datetime-local"
                    value={filters.to}
                    onChange={(e) => handleFilterChange('to', e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Từ số tiền (VND)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Đến số tiền (VND)</label>
                  <input
                    type="number"
                    placeholder="VD: 500000"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Payable now only toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={payableNowOnly}
                  onChange={(e) => setPayableNowOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span>Chỉ hiển thị khoản nợ có thể thanh toán ngay (payableNowOnly)</span>
              </label>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors"
              >
                Áp dụng
              </button>
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Chi tiết khoản nợ (Breakdown)
            </h2>
              <span className="text-sm text-gray-500">
                {debtItems.length} khoản nợ trong trang hiện tại
              </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-5 gap-3 pb-3 border-b border-gray-200 text-xs font-semibold text-gray-600 mb-3">
            <div>Loại</div>
            <div>Mã đơn/Tham chiếu</div>
            <div>Số tiền (VND)</div>
            <div>Trạng thái</div>
            <div>Ngày phát sinh</div>
          </div>

          {/* Table Content */}
          {debtLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Đang tải breakdown nợ...
            </div>
          ) : debtItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Không có khoản nợ nào theo bộ lọc hiện tại.
            </div>
          ) : (
            <div className="space-y-2">
              {debtItems.map((item, index) => {
                const isPaid = item.status === 'PAID';
                const isUnpaid = item.status === 'UNPAID';
                return (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-3 py-2 text-sm text-gray-900 hover:bg-gray-50 rounded-lg"
                  >
                    <div>{item.displayType}</div>
                    <div className="font-mono text-xs">
                      {item.orderCode || '-'}
                      {item.ghnOrderCode && (
                        <div className="text-[10px] text-gray-500">
                          GHN: {item.ghnOrderCode}
                        </div>
                      )}
                    </div>
                    <div className="font-medium">{formatCurrency(item.amount)}</div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          isPaid
                            ? 'bg-green-100 text-green-700'
                            : isUnpaid
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {isPaid
                          ? 'Đã thanh toán'
                          : isUnpaid
                          ? 'Chưa thanh toán'
                          : item.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(item.occurredAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskWarningDashboard;
