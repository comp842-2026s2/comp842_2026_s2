import { Navigate, Outlet } from "react-router-dom";
import { studentAuthService } from "../services/StudentAuthService";

const StudentProtectedRoute = () => {
  return studentAuthService.isLoggedIn() ? (
    <Outlet />
  ) : (
    <Navigate to="/student/login" replace />
  );
};

export default StudentProtectedRoute;
