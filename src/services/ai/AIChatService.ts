import HttpInterceptor from '../HttpInterceptor';

export interface AIChatRequest {
  userId: string;
  message: string;
  userName?: string;
}

export interface AIChatResponse {
  answer: string;
  message: string;
  userName: string;
  userId: string;
}

export class AIChatService {
  private static readonly BASE_URL = '/api/ai';

  /**
   * Send message to AI chatbot
   */
  static async sendMessage(request: AIChatRequest): Promise<AIChatResponse> {
    const endpoint = `${this.BASE_URL}/chat`;
    
    return await HttpInterceptor.post<AIChatResponse>(endpoint, request, {
      userType: 'customer',
    });
  }
}

export default AIChatService;
