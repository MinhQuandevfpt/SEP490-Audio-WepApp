import { useStaffAuthContext } from '../contexts/StaffAuthContext';

export const useStaffAuth = () => {
  return useStaffAuthContext();
};

export default useStaffAuth;


