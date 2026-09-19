import { Navigate, Outlet } from "react-router-dom";
import type { LoginType } from "../models/Auth";
import { authService } from "../services/AuthService";
import { authStorage } from "../utils/AuthStorage";

interface ProtectedRouteProps {
  allowedLoginTypes?: LoginType[];
}

const ProtectedRoute = ({ allowedLoginTypes }: ProtectedRouteProps) => {
  const auth = authStorage.get();

  if (!auth?.access_token) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedLoginTypes &&
    !allowedLoginTypes.includes(auth.login_type)
  ) {
    return <Navigate to={authService.getDefaultRoute(auth.login_type)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
