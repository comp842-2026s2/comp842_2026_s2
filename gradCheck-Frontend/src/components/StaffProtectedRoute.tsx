import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../services/AuthService";

const StaffProtectedRoute = () => {
  return authService.isStaff() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default StaffProtectedRoute;
