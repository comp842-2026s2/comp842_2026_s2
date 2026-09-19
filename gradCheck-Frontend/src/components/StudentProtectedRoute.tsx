import { Navigate, Outlet } from "react-router-dom";
import { studentAuthService } from "../services/StudentAuthService";

const StudentProtectedRoute = () => {
  return studentAuthService.isLoggedIn() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default StudentProtectedRoute;
