import { HttpInterceptor } from '../HttpInterceptor';
import type { CreateReviewRequest, ReviewResponse } from '../../types/api';

export class ReviewService {
  static async createReview(payload: CreateReviewRequest): Promise<ReviewResponse> {
    const response = await HttpInterceptor.post<ReviewResponse>(
      '/api/reviews',
      payload,
      { userType: 'customer' }
    );
    return response;
  }
}

export default ReviewService;

