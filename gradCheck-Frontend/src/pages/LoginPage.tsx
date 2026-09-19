import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { StudentLoginRequest } from "../models/Auth";
import { studentAuthService } from "../services/StudentAuthService";

// Renamed from StudentLoginPage — this page is shared by students and
// staff (one /login route, see App.tsx), so it lives at the top level
// under pages/ instead of being nested under a student-only path.
const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentLoginRequest>({
    login_id: "",
    login_password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await studentAuthService.login(form);
      // One shared login for everyone — where it lands depends on
      // login_type (1 = student, 2 = admin/staff), not on which URL was
      // used to reach this page.
      navigate(result.login_type === 2 ? "/staff/dashboard" : "/student/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3 mb-1">Login</h1>
              <p className="text-muted mb-4">
                Sign in with your ID and password — students and staff use
                the same login.
              </p>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="login_id" className="form-label">
                    ID
                  </label>
                  <input
                    id="login_id"
                    className="form-control"
                    value={form.login_id}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        login_id: e.target.value,
                      }))
                    }
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="login_password" className="form-label">
                    Password
                  </label>
                  <input
                    id="login_password"
                    type="password"
                    className="form-control"
                    value={form.login_password}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        login_password: e.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Login"}
                </button>
              </form>

              <p className="text-center mt-3 mb-1">
                Need an account?{" "}
                <Link to="/student/register">Register as a student</Link>
              </p>
              <p className="text-center text-muted small mb-0">
                Staff accounts are created by an existing admin — ask
                yours to register you under Staff → Register Staff.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
