// API Types for Customer Authentication

// Register Request
export interface CustomerRegisterRequest {
  name: string;
  password: string;
  email: string;
  phone: string;
}

// Register Response
export interface CustomerRegisterResponse {
  status: number;
  message: string;
  data: {
    email: string;
    name: string;
    phone: string;
  };
}

// Login Request
export interface CustomerLoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

// Login Response
export interface CustomerLoginResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    user: {
      email: string;
      fullName: string;
      role: string;
    };
    tokenType: string;
  };
}

// Generic API Response
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Error Response
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// User Profile
export interface CustomerProfile {
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default {};