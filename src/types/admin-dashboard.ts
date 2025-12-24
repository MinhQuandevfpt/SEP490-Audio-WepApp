export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}


export interface PlatformRevenueOverview {
  deliveredItemCount: number;     
  totalItemRevenue: number;        
  platformFeeRevenue: number;       
}

export type PlatformRevenueOverviewResponse = ApiResponse<PlatformRevenueOverview>;


export interface GrowthChartPoint {
  year: number;
  month: number;                   
  platformRevenue: number;         
  returnRate: number;              
}

export type GrowthChartResponse = ApiResponse<GrowthChartPoint[]>;

export interface UserStoreOverview {
  totalCustomerAccounts: number;       
  year: number;                         
  month: number;                        
  newCustomersInMonth: number;          
  newStoresInMonth: number;             
  newCustomersPrevMonth: number;        
  newStoresPrevMonth: number;           
  customerGrowthPercent: number;        
  storeGrowthPercent: number;           
  totalStores: number;                  
}

export type UserStoreOverviewResponse = ApiResponse<UserStoreOverview>;

export interface UserStoreGrowthChartPoint {
  year: number;
  month: number;                        
  newCustomers: number;                 
  newStores: number;                    
}

export type UserStoreGrowthChartResponse = ApiResponse<UserStoreGrowthChartPoint[]>;


export interface AdminDashboardData {
  overview: PlatformRevenueOverview;
  monthlyGrowth: GrowthChartPoint[];
  yearlyGrowth: GrowthChartPoint[];
  userStoreOverview?: UserStoreOverview;
  userStoreGrowthChart?: UserStoreGrowthChartPoint[];
}

