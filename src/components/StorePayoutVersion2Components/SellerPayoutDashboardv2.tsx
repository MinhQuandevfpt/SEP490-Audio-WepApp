import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Lock,
  Timer,
  Wallet,
  TriangleAlert,
} from 'lucide-react';
import { FinanceService } from '../../services/seller/FinanceService';
import type { PayoutSummary, PayoutItem, PayoutBucket } from '../../types/seller';

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '0 ₫';
  return `${value.toLocaleString('vi-VN')} ₫`;
};

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

interface SellerPayoutDashboardv2Props {
  from?: string;
  to?: string;
}

const SellerPayoutDashboardv2: React.FC<SellerPayoutDashboardv2Props> = ({
  from,
  to,
}) => {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Breakdown list state
  const [selectedBucket, setSelectedBucket] = useState<PayoutBucket>('PENDING');
  const [items, setItems] = useState<PayoutItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Payout modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [payoutResult, setPayoutResult] = useState<{
    processedCount: number;
    skippedCount: number;
    addedToDefaultBalance: number;
    defaultBalanceBefore?: number;
    defaultBalanceAfter?: number;
    totalPlatformFee?: number;
    totalGross?: number;
    processedItemIds?: string[];
    skippedReasons?: string[];
    ranAt?: string;
    storeId?: string;
  } | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { from?: string; to?: string } = {};
      if (from) params.from = from;
      if (to) params.to = to;

      console.log('📡 [Payout Summary V2] Loading with params:', params);

      const data = await FinanceService.getPayoutSummary(params);
      setSummary(data);

      console.log('✅ [Payout Summary V2] Loaded:', data);
    } catch (err: any) {
      console.error('❌ [Payout Summary V2] Error:', err);
      setError(err?.message || 'Không thể tải tổng quan chi trả');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const loadItems = useCallback(async () => {
    try {
      setItemsLoading(true);
      setItemsError(null);

      const params: {
        bucket: PayoutBucket;
        from?: string;
        to?: string;
        page: number;
        size: number;
      } = {
        bucket: selectedBucket,
        page: currentPage,
        size: pageSize,
      };

      if (from) params.from = from;
      if (to) params.to = to;

      console.log('📡 [Payout Items V2] Loading with params:', params);

      const data = await FinanceService.getPayoutItems(params);
      setItems(data.items);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);

      console.log('✅ [Payout Items V2] Loaded:', data);
    } catch (err: any) {
      console.error('❌ [Payout Items V2] Error:', err);
      setItemsError(err?.message || 'Không thể tải danh sách chi trả');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [selectedBucket, from, to, currentPage, pageSize]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reset to page 0 when bucket changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedBucket]);

  const handlePayout = async () => {
    try {
      setIsProcessing(true);

      console.log('📡 [Auto Process Payout] Starting...');

      const result = await FinanceService.autoProcessPayout();

      console.log('✅ [Auto Process Payout] Success:', result);

      // Close confirmation modal
      setShowPayoutModal(false);

      // Set result and show result modal
      setPayoutResult(result);
      setShowResultModal(true);

      // Refresh summary and items
      await Promise.all([loadSummary(), loadItems()]);
    } catch (err: any) {
      console.error('❌ [Auto Process Payout] Error:', err);
      // Set error result
      setPayoutResult({
        processedCount: 0,
        skippedCount: 0,
        addedToDefaultBalance: 0,
      });
      setShowResultModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-orange-500" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
        Không có dữ liệu chi trả.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Balance - Tiền đang bị HOLD */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-yellow-50 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Tiền đang bị giữ
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.pendingGross)}
            </div>
            <div className="text-xs text-gray-500">
              {summary.pendingCount} đơn hàng đã giao nhưng chưa đủ điều kiện
            </div>
          </div>
        </div>

        {/* Platform Fee Payable - Phí nền tảng phải thu */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Phí nền tảng phải thu
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.platformFeePayable)}
            </div>
            <div className="text-xs text-gray-500">
              {summary.eligibleNotPayoutCount} đơn hàng đã đủ điều kiện nhưng chưa giải ngân
            </div>
          </div>
        </div>

        {/* Available Balance - Tiền có thể rút */}
        <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-500 p-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Tổng tiền đã giải ngân
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(summary.availableNet)}
            </div>
            <div className="text-xs text-gray-600">
              {summary.payoutDoneCount} đơn hàng đã được giải ngân
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết chi trả
          </h3>
          <button
            onClick={loadSummary}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Pending Section */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">
                Đang bị giữ
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Số đơn hàng:</span>
                <span className="font-medium text-gray-900">
                  {summary.pendingCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tổng tiền gốc:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(summary.pendingGross)}
                </span>
              </div>
              <div className="mt-2 rounded bg-yellow-100 p-2 text-xs text-yellow-800 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Tiền này đang bị giữ, chưa thể rút hoặc sử dụng
              </div>
            </div>
          </div>

          {/* Eligible Not Payout Section */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                Đã đủ điều kiện thanh toán
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Số đơn hàng:</span>
                <span className="font-medium text-gray-900">
                  {summary.eligibleNotPayoutCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tổng tiền gốc:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(summary.eligibleNotPayoutGross)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Phí nền tảng:</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(summary.platformFeePayable)}
                </span>
              </div>
              <div className="mt-2 rounded bg-blue-100 p-2 text-xs text-blue-800 flex items-center gap-1">
                <Timer className="h-3 w-3" /> Đã đủ điều kiện nhưng hệ thống chưa giải ngân
              </div>
            </div>
          </div>

          {/* Available Balance Section */}
          <div className="rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-gray-700">
                Đã giải ngân 
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Số đơn hàng</div>
                <div className="text-lg font-bold text-gray-900">
                  {summary.payoutDoneCount}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Tổng tiền gốc</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(summary.availableGross)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Phí nền tảng đã trừ</div>
                <div className="text-lg font-bold text-red-600">
                  -{formatCurrency(summary.platformFeePaid)}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border-2 border-orange-400 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Wallet className="h-4 w-4" /> Tiền shop thực nhận / có thể rút:
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary.availableNet)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                = {formatCurrency(summary.availableGross)} -{' '}
                {formatCurrency(summary.platformFeePaid)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách chi tiết
          </h3>
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={isProcessing || (summary?.eligibleNotPayoutCount || 0) === 0}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DollarSign className="h-4 w-4" />
            Payout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          {(['PENDING', 'ELIGIBLE_NOT_PAYOUT', 'PAYOUT_DONE'] as PayoutBucket[]).map((bucket) => {
            const isActive = selectedBucket === bucket;
            const getBucketInfo = (b: PayoutBucket) => {
              switch (b) {
                case 'PENDING':
                  return {
                    label: 'Đang bị giữ',
                    count: summary?.pendingCount || 0,
                    activeClass: 'border-b-2 border-yellow-500 text-yellow-600',
                  };
                case 'ELIGIBLE_NOT_PAYOUT':
                  return {
                    label: 'Đã đủ điều kiện',
                    count: summary?.eligibleNotPayoutCount || 0,
                    activeClass: 'border-b-2 border-blue-500 text-blue-600',
                  };
                case 'PAYOUT_DONE':
                  return {
                    label: 'Đã giải ngân',
                    count: summary?.payoutDoneCount || 0,
                    activeClass: 'border-b-2 border-orange-500 text-orange-600',
                  };
              }
            };

            const info = getBucketInfo(bucket);

            return (
              <button
                key={bucket}
                onClick={() => setSelectedBucket(bucket)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? info.activeClass
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {info.label} ({info.count})
              </button>
            );
          })}
        </div>

        {/* Items Table */}
        {itemsLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-orange-500" />
              <span>Đang tải danh sách...</span>
            </div>
          </div>
        ) : itemsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {itemsError}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
            Không có dữ liệu trong nhóm này.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Mã đơn hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Tiền gốc
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Phí nền tảng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Tiền thực nhận
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Ngày giao hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {item.orderCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {formatCurrency(item.finalLineTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-red-600 font-medium">
                          {formatCurrency(item.platformFeeAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({item.platformFeePercentage}%)
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-orange-600">
                        {formatCurrency(item.netAfterFee)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDateTime(item.deliveredAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {item.isReturned && (
                            <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Đã trả hàng
                            </span>
                          )}
                          {/* Hiển thị trạng thái dựa trên bucket đang chọn */}
                          {selectedBucket === 'PENDING' && !item.eligibleForPayout && !item.isPayout && (
                            <span className="inline-flex w-fit items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              Đang bị giữ
                            </span>
                          )}
                          {item.eligibleForPayout && !item.isPayout && (
                            <span className="inline-flex w-fit items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Đủ điều kiện
                            </span>
                          )}
                          {!item.eligibleForPayout && !item.isPayout && selectedBucket !== 'PENDING' && (
                            <span className="inline-flex w-fit items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                              Chưa đủ điều kiện
                            </span>
                          )}
                          {item.isPayout && (
                            <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              Đã giải ngân
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {items.length} / {totalElements} mục
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-sm text-gray-700">
                    Trang {currentPage + 1} / {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payout Confirmation Modal */}
      {showPayoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isProcessing && setShowPayoutModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Xác nhận Payout
            </h3>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600">
                Bạn có chắc chắn muốn thực hiện payout tự động cho tất cả các đơn hàng đã đủ điều kiện không?
              </p>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">Thông tin payout:</div>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                    <li>
                      Số đơn hàng sẽ được xử lý:{' '}
                      <span className="font-semibold">
                        {summary?.eligibleNotPayoutCount || 0}
                      </span>
                    </li>
                    <li>
                      Tổng tiền gốc:{' '}
                      <span className="font-semibold">
                        {formatCurrency(summary?.eligibleNotPayoutGross || 0)}
                      </span>
                    </li>
                    <li>
                      Phí nền tảng sẽ trừ:{' '}
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(summary?.platformFeePayable || 0)}
                      </span>
                    </li>
                    <li>
                      Tiền sẽ chuyển vào ví:{' '}
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(
                          (summary?.eligibleNotPayoutGross || 0) -
                            (summary?.platformFeePayable || 0)
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-xs text-yellow-800 flex items-start gap-1">
                  <TriangleAlert className="h-3 w-3 mt-0.5 flex-shrink-0" /> 
                  <span>Hệ thống sẽ tự động thanh toán các sản phẩm trong đơn hàng đã đủ điều kiện thanh toán (Giao hàng thành công lớn hơn 7 ngày và không bị hoàn trả sản phẩm).</span>
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => !isProcessing && setShowPayoutModal(false)}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handlePayout}
                disabled={isProcessing}
                className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Xác nhận Payout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            {payoutError ? (
              // Error State
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Lỗi xử lý</h3>
                </div>
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{payoutError}</p>
                </div>
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setPayoutError(null);
                  }}
                  className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-red-600"
                >
                  Đóng
                </button>
              </div>
            ) : payoutResult ? (
              // Success/Info State
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    payoutResult.processedCount > 0 
                      ? 'bg-green-100' 
                      : 'bg-blue-100'
                  }`}>
                    {payoutResult.processedCount > 0 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {payoutResult.processedCount > 0 
                      ? 'Payout thành công!' 
                      : 'Không có item nào đủ điều kiện'}
                  </h3>
                </div>

                <div className="mb-6 space-y-3">
                  {payoutResult.processedCount > 0 ? (
                    <>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Số item đã xử lý:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {payoutResult.processedCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tổng tiền đã chuyển:</span>
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(payoutResult.addedToDefaultBalance)}
                            </span>
                          </div>
                          {payoutResult.defaultBalanceBefore !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Số dư trước:</span>
                              <span className="text-sm text-gray-900">
                                {formatCurrency(payoutResult.defaultBalanceBefore)}
                              </span>
                            </div>
                          )}
                          {payoutResult.defaultBalanceAfter !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Số dư sau:</span>
                              <span className="text-sm font-semibold text-blue-600">
                                {formatCurrency(payoutResult.defaultBalanceAfter)}
                              </span>
                            </div>
                          )}
                          {payoutResult.totalPlatformFee !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Tổng phí nền tảng:</span>
                              <span className="text-sm text-gray-900">
                                {formatCurrency(payoutResult.totalPlatformFee)}
                              </span>
                            </div>
                          )}
                          {payoutResult.totalGross !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Tổng tiền gốc:</span>
                              <span className="text-sm text-gray-900">
                                {formatCurrency(payoutResult.totalGross)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {payoutResult.processedItemIds && payoutResult.processedItemIds.length > 0 && (
                        <div className="">
                          
                         
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm text-blue-700">
                        Không có item nào đủ điều kiện payout (eligibleForPayout = true AND isPayout = false).
                      </p>
                      {payoutResult.defaultBalanceAfter !== undefined && (
                        <div className="mt-3 flex justify-between border-t border-blue-200 pt-3">
                          <span className="text-sm text-blue-600">Số dư hiện tại:</span>
                          <span className="text-sm font-semibold text-blue-900">
                            {formatCurrency(payoutResult.defaultBalanceAfter)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setPayoutResult(null);
                  }}
                  className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-red-600"
                >
                  Đóng
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPayoutDashboardv2;

