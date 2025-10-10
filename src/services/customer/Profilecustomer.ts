import type { CustomerProfileResponse } from '../../types/api';
import { CustomerAuthService } from './Authcustomer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function httpGet<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || `HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export class ProfileCustomerService {
  static async getByCustomerId(customerId: string): Promise<CustomerProfileResponse> {
    const token = CustomerAuthService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const url = `${API_BASE_URL}/api/customers/${encodeURIComponent(customerId)}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `${tokenType} ${token}`;
    return await httpGet<CustomerProfileResponse>(url, headers);
  }
}

export default ProfileCustomerService;


