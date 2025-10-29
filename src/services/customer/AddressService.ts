/**
 * Customer Address Service
 * Handles customer address operations
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type { CustomerAddressApiItem, AddCustomerAddressRequest } from '../../types/api';
import { CustomerAuthService } from './Authcustomer';

export class AddressService {
  /**
   * Get customer ID from localStorage
   */
  private static getCustomerId(): string {
    const customerId = localStorage.getItem('customer_id');
    if (!customerId) {
      throw new Error('Customer ID not found. Please login again.');
    }
    return customerId;
  }

  /**
   * Get all addresses for customer
   * GET /api/customers/{customerId}/addresses
   */
  static async getAddresses(): Promise<CustomerAddressApiItem[]> {
    try {
      const customerId = this.getCustomerId();
      console.log('📍 Fetching addresses for customer:', customerId);

      const response = await HttpInterceptor.get<CustomerAddressApiItem[]>(
        `/api/customers/${customerId}/addresses`,
        { userType: 'customer' }
      );

      console.log('✅ Addresses fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch addresses:', error);
      throw error;
    }
  }

  /**
   * Create new address for customer
   * POST /api/customers/{customerId}/addresses
   */
  static async createAddress(data: Omit<AddCustomerAddressRequest, 'customerId'>): Promise<CustomerAddressApiItem> {
    try {
      const customerId = this.getCustomerId();
      console.log('📍 Creating address for customer:', customerId, data);

      const response = await HttpInterceptor.post<CustomerAddressApiItem>(
        `/api/customers/${customerId}/addresses`,
        data,
        { userType: 'customer' }
      );

      console.log('✅ Address created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create address:', error);
      throw error;
    }
  }

  /**
   * Update existing address for customer
   * PUT /api/customers/{customerId}/addresses/{addressId}
   */
  static async updateAddress(
    addressId: string,
    data: Omit<AddCustomerAddressRequest, 'customerId'>
  ): Promise<CustomerAddressApiItem> {
    try {
      const customerId = this.getCustomerId();
      console.log('📍 Updating address for customer:', customerId, 'address:', addressId, data);

      const response = await HttpInterceptor.put<CustomerAddressApiItem>(
        `/api/customers/${customerId}/addresses/${addressId}`,
        data,
        { userType: 'customer' }
      );

      console.log('✅ Address updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update address:', error);
      throw error;
    }
  }

  /**
   * Delete address for customer
   * DELETE /api/customers/{customerId}/addresses/{addressId}
   */
  static async deleteAddress(addressId: string): Promise<void> {
    try {
      const customerId = this.getCustomerId();
      console.log('📍 Deleting address for customer:', customerId, 'address:', addressId);

      await HttpInterceptor.delete<void>(
        `/api/customers/${customerId}/addresses/${addressId}`,
        { userType: 'customer' }
      );

      console.log('✅ Address deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete address:', error);
      throw error;
    }
  }

  /**
   * Check if customer is authenticated
   */
  static isAuthenticated(): boolean {
    return CustomerAuthService.isAuthenticated();
  }
}

export default AddressService;

