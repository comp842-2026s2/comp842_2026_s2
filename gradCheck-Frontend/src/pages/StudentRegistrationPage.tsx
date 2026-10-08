import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Degree } from "../models/Degree";
import type { StudentRegistrationRequest } from "../models/Student";
import { degreeService } from "../services/DegreeService";
import { studentRegistrationService } from "../services/StudentRegistrationService";

const initialForm: StudentRegistrationRequest = {
  student_id: "",
  student_name: "",
  degree_id: 0,
  wallet_address: "",
  conferral_date: "",
  student_password: "",
};

const StudentRegistrationPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentRegistrationRequest>(initialForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDegrees, setIsLoadingDegrees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoadingDegrees(true);

    degreeService
      .getDegrees()
      .then(setDegrees)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load degrees.",
        ),
      )
      .finally(() => setIsLoadingDegrees(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (form.degree_id === 0) {
      setError("Please select a degree.");
      return;
    }

    if (form.student_password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await studentRegistrationService.registerStudent({
        ...form,
        student_id: form.student_id.trim(),
        student_name: form.student_name.trim(),
        wallet_address: form.wallet_address.trim(),
      });

      const message = result.login_created
        ? "Registration successful. You can now log in with your student ID."
        : "Certificate registration succeeded, but the login account was not created. Please contact support.";

      navigate("/login", {
        replace: true,
        state: { message },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3">Student Registration</h1>
              <p className="text-muted">
                Register to receive and manage your graduation certificate.
              </p>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="student_id">
                    Student ID
                  </label>
                  <input
                    id="student_id"
                    className="form-control"
                    value={form.student_id}
                    onChange={(event) =>
                      setForm({ ...form, student_id: event.target.value })
                    }
                    autoComplete="username"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="student_name">
                    Student Name
                  </label>
                  <input
                    id="student_name"
                    className="form-control"
                    value={form.student_name}
                    onChange={(event) =>
                      setForm({ ...form, student_name: event.target.value })
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="degree_id">
                    Degree
                  </label>
                  <select
                    id="degree_id"
                    className="form-select"
                    value={form.degree_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        degree_id: Number(event.target.value),
                      })
                    }
                    disabled={isSubmitting || isLoadingDegrees}
                    required
                  >
                    <option value={0}>
                      {isLoadingDegrees
                        ? "Loading degrees..."
                        : "Select a degree"}
                    </option>
                    {degrees.map((degree) => (
                      <option key={degree.degree_id} value={degree.degree_id}>
                        {degree.degree_name} — {degree.university_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="wallet_address">
                    Wallet Address
                  </label>
                  <input
                    id="wallet_address"
                    className="form-control"
                    value={form.wallet_address}
                    onChange={(event) =>
                      setForm({ ...form, wallet_address: event.target.value })
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="conferral_date">
                    Graduation Date
                  </label>
                  <input
                    id="conferral_date"
                    type="date"
                    className="form-control"
                    value={form.conferral_date}
                    onChange={(event) =>
                      setForm({ ...form, conferral_date: event.target.value })
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="student_password">
                    Password
                  </label>
                  <input
                    id="student_password"
                    type="password"
                    className="form-control"
                    value={form.student_password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        student_password: event.target.value,
                      })
                    }
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="confirm_password">
                    Confirm Password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={isSubmitting || isLoadingDegrees}
                >
                  {isSubmitting ? "Registering..." : "Register Student"}
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Already registered? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistrationPage;
