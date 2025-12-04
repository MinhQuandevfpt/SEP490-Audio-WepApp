import { HttpInterceptor } from '../HttpInterceptor';
import type { ReviewResponse } from '../../types/api';

export interface ReviewListResponse {
  content: ReviewResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ProductReviewStatusResponse {
  hasReviewed: boolean;
  review?: ReviewResponse;
  message?: string;
}

export class ProductReviewService {
  static async getMyReviews(page: number = 0, size: number = 10): Promise<ReviewListResponse> {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    return HttpInterceptor.get<ReviewListResponse>(`/api/reviews/me?${query.toString()}`, {
      userType: 'customer',
    });
  }

  static async updateReview(reviewId: string, payload: { rating: number; content: string; media?: ReviewResponse['media'] | null }): Promise<ReviewResponse> {
    return HttpInterceptor.put<ReviewResponse>(`/api/reviews/${reviewId}`, payload, {
      userType: 'customer',
    });
  }

  static async deleteReview(reviewId: string): Promise<void> {
    await HttpInterceptor.delete(`/api/reviews/${reviewId}`, {
      userType: 'customer',
    });
  }

  static async getProductReviews(
    productId: string,
    page: number = 0,
    size: number = 10
  ): Promise<ReviewListResponse> {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    return HttpInterceptor.get<ReviewListResponse>(
      `/api/reviews/product/${productId}?${query.toString()}`,
      { userType: 'customer' }
    );
  }

  static async getMyReviewForProduct(productId: string): Promise<ReviewResponse | null> {
    try {
      return await HttpInterceptor.get<ReviewResponse>(
        `/api/reviews/product/${productId}/me`,
        { userType: 'customer' }
      );
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check review status for a specific product in a specific order
   * GET /api/reviews/product/{productId}/me/status?orderId={orderId}
   */
  static async getProductReviewStatus(
    productId: string,
    orderId: string,
  ): Promise<ProductReviewStatusResponse> {
    const url = `/api/reviews/product/${productId}/me/status?orderId=${encodeURIComponent(orderId)}`;

    return HttpInterceptor.get<ProductReviewStatusResponse>(url, {
      userType: 'customer',
    });
  }
}

export default ProductReviewService;

