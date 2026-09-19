import { Navigate, Outlet } from "react-router-dom";
import { studentAuthService } from "../services/StudentAuthService";

const StudentProtectedRoute = () => {
  // isStudent() specifically, not just isLoggedIn() — now that login is
  // shared with staff, a staff token must not unlock student pages.
  return studentAuthService.isStudent() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default StudentProtectedRoute;
