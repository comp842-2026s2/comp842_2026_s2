import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../services/AuthService";

const StudentProtectedRoute = () => {
  return authService.isLoggedIn() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default StudentProtectedRoute;
