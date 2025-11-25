import { HttpInterceptor } from '../HttpInterceptor';
import type { StoreReviewListResponse } from '../../types/api';

export interface SellerReviewQuery {
  page?: number;
  size?: number;
  keyword?: string;
}

export class SellerReviewService {
  static async list(params: SellerReviewQuery = {}): Promise<StoreReviewListResponse> {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? 10),
    });

    if (params.keyword) {
      query.set('keyword', params.keyword);
    }

    return HttpInterceptor.get(`/api/store/reviews?${query.toString()}`, {
      userType: 'seller',
    });
  }

  static async reply(reviewId: string, content: string) {
    return HttpInterceptor.post(
      `/api/store/reviews/${reviewId}/reply`,
      { content },
      { userType: 'seller' }
    );
  }
}

export default SellerReviewService;

