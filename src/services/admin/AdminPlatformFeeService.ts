import { HttpInterceptor } from '../HttpInterceptor';
import type { PlatformFee, PlatformFeeListResponse, CreatePlatformFeeRequest, CreatePlatformFeeResponse } from '../../types/admin';

export class AdminPlatformFeeService {
  /**
   * Get all platform fees
   * GET /api/admin/platform-fees
   */
  static async getPlatformFees(): Promise<PlatformFee[]> {
    try {
      const response = await HttpInterceptor.get<PlatformFeeListResponse>(
        '/api/admin/platform-fees',
        { userType: 'admin' }
      );
      
      // API returns array directly, not wrapped in response object
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.error('Failed to fetch platform fees:', error);
      throw new Error(error?.message || 'Không thể tải danh sách phí nền tảng');
    }
  }

  /**
   * Create or update platform fee
   * POST /api/admin/platform-fees
   * - If feeId is empty (""): Create new
   * - If feeId has value: Update existing
   */
  static async savePlatformFee(request: CreatePlatformFeeRequest): Promise<CreatePlatformFeeResponse> {
    try {
      const response = await HttpInterceptor.post<CreatePlatformFeeResponse>(
        '/api/admin/platform-fees',
        request,
        { userType: 'admin' }
      );
      
      return response;
    } catch (error: any) {
      console.error('Failed to save platform fee:', error);
      const action = request.feeId ? 'cập nhật' : 'tạo';
      throw new Error(error?.message || `Không thể ${action} phí nền tảng`);
    }
  }
}

export default AdminPlatformFeeService;

