// Policy Management Types

export interface PolicyCategory {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  displayOrder: number;
  isActive: boolean;
  itemCount: number;
  policyItems: PolicyItem[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyItem {
  id: string;
  policyCategoryId: string;
  policyCategoryName: string;
  title: string;
  content: string;
  displayOrder: number;
  imageUrls: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request Types
export interface CreatePolicyCategoryRequest {
  name: string;
  description: string;
  iconUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UpdatePolicyCategoryRequest {
  name?: string;
  description?: string;
  iconUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreatePolicyItemRequest {
  policyCategoryId: string;
  title: string;
  content: string;
  displayOrder: number;
  imageUrls: string[];
  isActive: boolean;
}

export interface UpdatePolicyItemRequest {
  policyCategoryId?: string;
  title?: string;
  content?: string;
  displayOrder?: number;
  imageUrls?: string[];
  isActive?: boolean;
}

// Response Types
export interface PolicyCategoryResponse {
  status: number;
  message: string;
  data: PolicyCategory;
}

export interface PolicyCategoriesResponse {
  status: number;
  message: string;
  data: PolicyCategory[];
}

export interface PolicyItemResponse {
  status: number;
  message: string;
  data: PolicyItem;
}

export interface PolicyItemsResponse {
  status: number;
  message: string;
  data: PolicyItem[];
}
