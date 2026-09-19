import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LoginRequest } from "../models/Auth";
import { authService } from "../services/AuthService";
import { authStorage } from "../utils/AuthStorage";

type LoginLocationState = {
  message?: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;

  const [form, setForm] = useState<LoginRequest>({
    login_id: "",
    login_password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existingAuth = authStorage.get();

    if (existingAuth?.access_token) {
      navigate(authService.getDefaultRoute(existingAuth.login_type), {
        replace: true,
      });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authService.login({
        login_id: form.login_id.trim(),
        login_password: form.login_password,
      });

      navigate(authService.getDefaultRoute(result.login_type), {
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
              <h1 className="h3 mb-1">GradCheck Login</h1>
              <p className="text-muted mb-4">
                Sign in using your student ID or staff login ID.
              </p>

              {locationState?.message && (
                <div className="alert alert-success">
                  {locationState.message}
                </div>
              )}

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="login_id" className="form-label">
                    Login ID
                  </label>
                  <input
                    id="login_id"
                    className="form-control"
                    value={form.login_id}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        login_id: event.target.value,
                      }))
                    }
                    autoComplete="username"
                    disabled={isSubmitting}
                    required
                    autoFocus
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
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        login_password: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    disabled={isSubmitting}
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

              <p className="text-center mt-3 mb-0">
                Student without an account?{" "}
                <Link to="/student/register">Register here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
