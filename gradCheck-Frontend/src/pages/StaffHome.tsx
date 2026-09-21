import { Link } from "react-router-dom";
import { authService } from "../services/AuthService";

const Home = () => {
  const isSuperAdmin = authService.isSuperAdmin();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body text-center p-5">
              <h1 className="h3 mb-4">
                Staff Management
              </h1>

              {isSuperAdmin && (
                <div className="mt-3">
                  <Link to="/staff/register">
                    Register Staff
                  </Link>
                </div>
              )}

              <div className="mt-3">
                <Link to="/staff/dashboard">
                  View Dashboard
                </Link>
              </div>

              <div className="mt-3">
                <Link to="/staff/certificates">
                  Generate Certificates and Tokens
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;