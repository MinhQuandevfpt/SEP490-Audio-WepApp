import type {
  CustomerProfileResponse,
  UpdateCustomerRequest,
  GetCustomerAddressesResponse,
  AddCustomerAddressRequest,
  AddCustomerAddressResponse,
  UpdateCustomerAddressRequest,
  UpdateCustomerAddressResponse
} from '../../types/api';
import { CustomerAuthService } from './Authcustomer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

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

async function httpPut<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      throw new Error(responseBody?.message || `HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function httpPost<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      throw new Error(responseBody?.message || `HTTP ${res.status}`);
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

  static async updateByCustomerId(customerId: string, payload: Omit<UpdateCustomerRequest, 'customerId'>): Promise<CustomerProfileResponse> {
    const token = CustomerAuthService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const url = `${API_BASE_URL}/api/customers/${encodeURIComponent(customerId)}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `${tokenType} ${token}`;
    return await httpPut<CustomerProfileResponse>(url, payload, headers);
  }

  // Addresses
  static async getAddresses(customerId: string): Promise<GetCustomerAddressesResponse> {
    const token = CustomerAuthService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const url = `${API_BASE_URL}/api/customers/${encodeURIComponent(customerId)}/addresses`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `${tokenType} ${token}`;
    return await httpGet<GetCustomerAddressesResponse>(url, headers);
  }

  static async addAddress(customerId: string, payload: Omit<AddCustomerAddressRequest, 'customerId'>): Promise<AddCustomerAddressResponse> {
    const token = CustomerAuthService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const url = `${API_BASE_URL}/api/customers/${encodeURIComponent(customerId)}/addresses`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `${tokenType} ${token}`;
    return await httpPost<AddCustomerAddressResponse>(url, payload, headers);
  }

  static async updateAddress(customerId: string, addressId: string, payload: Omit<UpdateCustomerAddressRequest, 'customerId' | 'addressId'>): Promise<UpdateCustomerAddressResponse> {
    const token = CustomerAuthService.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const url = `${API_BASE_URL}/api/customers/${encodeURIComponent(customerId)}/addresses/${encodeURIComponent(addressId)}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `${tokenType} ${token}`;
    return await httpPut<UpdateCustomerAddressResponse>(url, payload, headers);
  }
}

export default ProfileCustomerService;


