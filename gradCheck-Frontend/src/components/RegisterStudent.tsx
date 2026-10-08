import { useEffect, useState } from "react";

import type { Degree } from "../models/Degree";
import type { RegistrationRequest } from "../models/Registration";

import { degreeService } from "../services/DegreeService";
import { registrationService } from "../services/RegistrationService";

const initialForm: RegistrationRequest = {
  student_id: "",
  student_name: "",
  degree_id: 0,
  wallet_address: "",
  conferral_date: "",
};

const RegisterStudent = () => {
  const [form, setForm] = useState<RegistrationRequest>(initialForm);

  const [password, setPassword] = useState("");

  const [degrees, setDegrees] = useState<Degree[]>([]);

  const [status, setStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoadingDegrees, setIsLoadingDegrees] = useState(true);

  useEffect(() => {
    const loadDegrees = async () => {
      try {
        setIsLoadingDegrees(true);

        const result = await degreeService.getDegrees();

        setDegrees(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load degrees");
      } finally {
        setIsLoadingDegrees(false);
      }
    };

    loadDegrees();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleDegreeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((previous) => ({
      ...previous,
      degree_id: Number(event.target.value),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus(null);
    setError(null);

    if (form.degree_id === 0) {
      setError("Please select a degree");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registrationService.registerStudent(form, password);

      setStatus(
        `Student registered successfully. Registration ID: ${result.registration_id}`,
      );

      setForm(initialForm);
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error — backend may be offline",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white py-3">
              <h2 className="h4 mb-0">Register Student</h2>
            </div>

            <div className="card-body p-4">
              {status && (
                <div className="alert alert-success" role="alert">
                  {status}
                </div>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="student_id" className="form-label">
                    Student ID
                  </label>

                  <input
                    id="student_id"
                    type="text"
                    name="student_id"
                    className="form-control"
                    value={form.student_id}
                    onChange={handleChange}
                    placeholder="Enter student ID"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    className="form-control"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="student_name" className="form-label">
                    Student Name
                  </label>

                  <input
                    id="student_name"
                    type="text"
                    name="student_name"
                    className="form-control"
                    value={form.student_name}
                    onChange={handleChange}
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="degree_id" className="form-label">
                    Degree
                  </label>

                  <select
                    id="degree_id"
                    name="degree_id"
                    className="form-select"
                    value={form.degree_id}
                    onChange={handleDegreeChange}
                    disabled={isLoadingDegrees}
                    required
                  >
                    <option value={0}>
                      {isLoadingDegrees
                        ? "Loading degrees..."
                        : "Select a degree"}
                    </option>

                    {degrees.map((degree) => (
                      <option key={degree.degree_id} value={degree.degree_id}>
                        {degree.degree_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="wallet_address" className="form-label">
                    Wallet Address
                  </label>

                  <input
                    id="wallet_address"
                    type="text"
                    name="wallet_address"
                    className="form-control"
                    value={form.wallet_address}
                    onChange={handleChange}
                    placeholder="Enter wallet address"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="conferral_date" className="form-label">
                    Graduation Date
                  </label>

                  <input
                    id="conferral_date"
                    type="date"
                    name="conferral_date"
                    className="form-control"
                    value={form.conferral_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || isLoadingDegrees}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Registering...
                      </>
                    ) : (
                      "Register Student"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
