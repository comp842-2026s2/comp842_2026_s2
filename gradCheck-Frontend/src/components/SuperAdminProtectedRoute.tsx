import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../services/AuthService";

// Gates /staff/register specifically — a regular staff account is staff
// (isStaff() true) but not the fixed "admin" account, so it gets bounced
// to the staff dashboard instead of the registration form. This mirrors
// StaffProtectedRoute's pattern; the backend enforces the same rule via
// require_super_admin in main.py, so this is UX, not the real boundary.
const SuperAdminProtectedRoute = () => {
  return authService.isSuperAdmin() ? (
    <Outlet />
  ) : (
    <Navigate to="/staff/dashboard" replace />
  );
};

export default SuperAdminProtectedRoute;
