import { NavLink, useNavigate } from "react-router-dom";
import { studentAuthService } from "../services/StudentAuthService";

const StudentNavigation = () => {
  const navigate = useNavigate();

  const logout = () => {
    studentAuthService.logout();
    navigate("/student/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <NavLink className="navbar-brand" to="/student/dashboard">
          GradCheck
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#studentNavigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="studentNavigation">
          <div className="navbar-nav me-auto">
            <NavLink className="nav-link" to="/student/dashboard">
              Dashboard
            </NavLink>
            <NavLink className="nav-link" to="/student/certificate">
              Certificate
            </NavLink>
            <NavLink className="nav-link" to="/student/verification-links">
              Verification Links
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

export default StudentNavigation;
