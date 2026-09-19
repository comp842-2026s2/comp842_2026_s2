import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../services/StudentAuthService";

const StaffProtectedRoute = () => {
  return authService.isStaff() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default StaffProtectedRoute;
