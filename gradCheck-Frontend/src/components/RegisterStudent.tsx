import { useState } from "react";
import type { RegistrationRequest } from "../models/Registration";
import { registrationService } from "../services/RegistrationService";

const initialForm: RegistrationRequest = {
  student_id: "",
  student_name: "",
  degree_id: 0,
  wallet_address: "",
  conferral_date: "",
};

const RegisterStudent = () => {
  const [form, setForm] =
    useState<RegistrationRequest>(initialForm);

  const [status, setStatus] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "degree_id"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setStatus(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const result =
        await registrationService.registerStudent(form);

      setStatus(
        `Student registered successfully. Registration ID: ${result.registration_id}`
      );

      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error — backend may be offline"
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
              <h2 className="h4 mb-0">
                Register Student
              </h2>
            </div>

            <div className="card-body p-4">

              {status && (
                <div
                  className="alert alert-success"
                  role="alert"
                >
                  {status}
                </div>
              )}

              {error && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label
                    htmlFor="student_id"
                    className="form-label"
                  >
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
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="student_name"
                    className="form-label"
                  >
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
                  <label
                    htmlFor="degree_id"
                    className="form-label"
                  >
                    Degree ID
                  </label>

                  <input
                    id="degree_id"
                    type="number"
                    name="degree_id"
                    className="form-control"
                    value={form.degree_id}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="wallet_address"
                    className="form-label"
                  >
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
                  <label
                    htmlFor="conferral_date"
                    className="form-label"
                  >
                    Conferral Date
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
                    disabled={isSubmitting}
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