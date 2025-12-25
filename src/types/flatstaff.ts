// FlatStaff Types
export interface FlatStaffAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateFlatStaffRequest {
  name: string;
  password: string;
  email: string;
  phone: string;
}

export interface CreateFlatStaffResponse {
  status: number;
  message: string;
  data: FlatStaffAccount;
}

export interface FlatStaffListResponse {
  status: number;
  message: string;
  data: {
    content: FlatStaffAccount[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
  };
}

export interface FlatStaffListParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
}
