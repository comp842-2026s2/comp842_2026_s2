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
};

const StudentRegistrationPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [password, setPassword] = useState("");
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    degreeService
      .getDegrees()
      .then(setDegrees)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load degrees.")
      );
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (form.degree_id === 0) {
      setError("Please select a degree.");
      return;
    }

    setIsSubmitting(true);

    try {
      await studentRegistrationService.registerStudent(form, password);
      navigate("/student/login", {
        replace: true,
        state: { message: "Registration successful. Please log in." },
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
                    onChange={(e) =>
                      setForm({ ...form, student_id: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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
                    onChange={(e) =>
                      setForm({ ...form, student_name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, degree_id: Number(e.target.value) })
                    }
                    required
                  >
                    <option value={0}>Select a degree</option>
                    {degrees.map((degree) => (
                      <option key={degree.degree_id} value={degree.degree_id}>
                        {degree.degree_name}
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
                    onChange={(e) =>
                      setForm({ ...form, wallet_address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="conferral_date">
                    Conferral Date
                  </label>
                  <input
                    id="conferral_date"
                    type="date"
                    className="form-control"
                    value={form.conferral_date}
                    onChange={(e) =>
                      setForm({ ...form, conferral_date: e.target.value })
                    }
                    required
                  />
                </div>

                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Register Student"}
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Already registered? <Link to="/student/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistrationPage;
