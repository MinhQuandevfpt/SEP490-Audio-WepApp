import type { Province, ProvinceListResponse, District, DistrictListResponse, DistrictRequest, Ward, WardListResponse, WardRequest } from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

const httpClient = new HttpClient(API_URL);

export class GhnService {
  /**
   * Lấy danh sách tỉnh từ GHN API
   */
  static async getProvinces(): Promise<ProvinceListResponse> {
    try {
      const response = await httpClient.get<ProvinceListResponse>('/ghn/provinces');
      return response;
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      throw new Error('Không thể tải danh sách tỉnh. Vui lòng thử lại.');
    }
  }

  /**
   * Lấy danh sách tỉnh đã được filter (chỉ những tỉnh đang hoạt động)
   */
  static async getActiveProvinces(): Promise<Province[]> {
    try {
      const response = await this.getProvinces();
      // Filter chỉ những tỉnh có IsEnable = 1 và Status = 1
      const activeProvinces = response.data.filter(
        province => province.IsEnable === 1 && province.Status === 1
      );
      
      // Sort theo tên tỉnh
      return activeProvinces.sort((a, b) => 
        a.ProvinceName.localeCompare(b.ProvinceName, 'vi')
      );
    } catch (error) {
      console.error('Failed to fetch active provinces:', error);
      throw error;
    }
  }

  /**
   * Tìm tỉnh theo ID
   */
  static async getProvinceById(provinceId: number): Promise<Province | null> {
    try {
      const provinces = await this.getActiveProvinces();
      return provinces.find(province => province.ProvinceID === provinceId) || null;
    } catch (error) {
      console.error('Failed to find province by ID:', error);
      return null;
    }
  }

  /**
   * Tìm tỉnh theo tên (search)
   */
  static async searchProvinces(query: string): Promise<Province[]> {
    try {
      const provinces = await this.getActiveProvinces();
      const lowercaseQuery = query.toLowerCase();
      
      return provinces.filter(province => 
        province.ProvinceName.toLowerCase().includes(lowercaseQuery) ||
        province.NameExtension.some(ext => 
          ext.toLowerCase().includes(lowercaseQuery)
        )
      );
    } catch (error) {
      console.error('Failed to search provinces:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách quận/huyện theo tỉnh từ GHN API
   */
  static async getDistricts(provinceId: number): Promise<DistrictListResponse> {
    try {
      const requestData: DistrictRequest = { province_id: provinceId };
      const response = await httpClient.post<DistrictListResponse>('/ghn/districts', requestData);
      return response;
    } catch (error) {
      console.error('Failed to fetch districts:', error);
      throw new Error('Không thể tải danh sách quận/huyện. Vui lòng thử lại.');
    }
  }

  /**
   * Lấy danh sách quận/huyện đã được filter (chỉ những quận/huyện đang hoạt động)
   */
  static async getActiveDistricts(provinceId: number): Promise<District[]> {
    try {
      const response = await this.getDistricts(provinceId);
      // Filter chỉ những quận/huyện có IsEnable = 1 và Status = 1
      const activeDistricts = response.data.filter(
        district => district.IsEnable === 1 && district.Status === 1
      );
      
      // Sort theo tên quận/huyện
      return activeDistricts.sort((a, b) => 
        a.DistrictName.localeCompare(b.DistrictName, 'vi')
      );
    } catch (error) {
      console.error('Failed to fetch active districts:', error);
      throw error;
    }
  }

  /**
   * Tìm quận/huyện theo ID
   */
  static async getDistrictById(provinceId: number, districtId: number): Promise<District | null> {
    try {
      const districts = await this.getActiveDistricts(provinceId);
      return districts.find(district => district.DistrictID === districtId) || null;
    } catch (error) {
      console.error('Failed to find district by ID:', error);
      return null;
    }
  }

  /**
   * Tìm quận/huyện theo tên (search)
   */
  static async searchDistricts(provinceId: number, query: string): Promise<District[]> {
    try {
      const districts = await this.getActiveDistricts(provinceId);
      const lowercaseQuery = query.toLowerCase();
      
      return districts.filter(district => 
        district.DistrictName.toLowerCase().includes(lowercaseQuery) ||
        district.NameExtension.some(ext => 
          ext.toLowerCase().includes(lowercaseQuery)
        )
      );
    } catch (error) {
      console.error('Failed to search districts:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách phường/xã theo quận/huyện từ GHN API
   */
  static async getWards(districtId: number): Promise<WardListResponse> {
    try {
      const requestData: WardRequest = { district_id: districtId };
      const response = await httpClient.post<WardListResponse>('/ghn/wards', requestData);
      return response;
    } catch (error) {
      console.error('Failed to fetch wards:', error);
      throw new Error('Không thể tải danh sách phường/xã. Vui lòng thử lại.');
    }
  }

  /**
   * Lấy danh sách phường/xã đã được filter (chỉ những phường/xã đang hoạt động)
   */
  static async getActiveWards(districtId: number): Promise<Ward[]> {
    try {
      const response = await this.getWards(districtId);
      // Filter chỉ những phường/xã có Status = 1
      const activeWards = response.data.filter(
        ward => ward.Status === 1
      );
      
      // Sort theo tên phường/xã
      return activeWards.sort((a, b) => 
        a.WardName.localeCompare(b.WardName, 'vi')
      );
    } catch (error) {
      console.error('Failed to fetch active wards:', error);
      throw error;
    }
  }

  /**
   * Tìm phường/xã theo WardCode
   */
  static async getWardByCode(districtId: number, wardCode: string): Promise<Ward | null> {
    try {
      const wards = await this.getActiveWards(districtId);
      return wards.find(ward => ward.WardCode === wardCode) || null;
    } catch (error) {
      console.error('Failed to find ward by code:', error);
      return null;
    }
  }

  /**
   * Tìm phường/xã theo tên (search)
   */
  static async searchWards(districtId: number, query: string): Promise<Ward[]> {
    try {
      const wards = await this.getActiveWards(districtId);
      const lowercaseQuery = query.toLowerCase();
      
      return wards.filter(ward => 
        ward.WardName.toLowerCase().includes(lowercaseQuery) ||
        ward.NameExtension.some(ext => 
          ext.toLowerCase().includes(lowercaseQuery)
        )
      );
    } catch (error) {
      console.error('Failed to search wards:', error);
      return [];
    }
  }
}

export default GhnService;
