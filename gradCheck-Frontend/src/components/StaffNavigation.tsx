import { NavLink, useNavigate } from "react-router-dom";
import { authService } from "../services/StudentAuthService";

const StaffNavigation = () => {
  const navigate = useNavigate();

  const logout = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <NavLink className="navbar-brand" to="/staff/dashboard">
          GradCheck Staff
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#staffNavigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="staffNavigation">
          <div className="navbar-nav me-auto">
            <NavLink className="nav-link" to="/staff/dashboard">
              Dashboard
            </NavLink>
            {/* Only the fixed "admin" account can register new staff —
                regular staff accounts don't even see the link. */}
            {authService.isSuperAdmin() && (
              <NavLink className="nav-link" to="/staff/register">
                Register Staff
              </NavLink>
            )}
            <NavLink className="nav-link" to="/staff/certificates">
              Certificates
            </NavLink>
          </div>

          <button className="btn btn-outline-light" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default StaffNavigation;
