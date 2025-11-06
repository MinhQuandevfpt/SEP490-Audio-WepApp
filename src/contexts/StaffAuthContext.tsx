import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StoreStaffAuthService } from '../services/staff/AuthStaff';
import type { StaffLoginRequest, StaffLoginResponse } from '../services/staff/AuthStaff';

interface StaffAuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    full_name: string;
    role: string;
    staff_id?: string;
    store_id?: string;
    phone?: string;
  } | null;
}

interface StaffAuthContextValue extends StaffAuthState {
  login: (data: StaffLoginRequest) => Promise<StaffLoginResponse>;
  logout: () => void;
}

const StaffAuthContext = createContext<StaffAuthContextValue | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StaffAuthState>({ isAuthenticated: false, user: null });

  useEffect(() => {
    const isAuth = StoreStaffAuthService.isAuthenticated();
    const user = StoreStaffAuthService.getCurrentUser();
    setState({ isAuthenticated: isAuth, user });
  }, []);

  const value = useMemo<StaffAuthContextValue>(() => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login: async (data: StaffLoginRequest) => {
      const res = await StoreStaffAuthService.login(data);
      const user = StoreStaffAuthService.getCurrentUser();
      setState({ isAuthenticated: true, user });
      return res;
    },
    logout: () => {
      StoreStaffAuthService.logout();
      setState({ isAuthenticated: false, user: null });
    }
  }), [state.isAuthenticated, state.user]);

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuthContext = (): StaffAuthContextValue => {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuthContext must be used within StaffAuthProvider');
  return ctx;
};

export default StaffAuthContext;


