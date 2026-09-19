import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Degree } from "../models/Degree";
import type {
  StudentCertificate,
  StudentCertificateRegistrationRequest,
} from "../models/Certificate";
import { degreeService } from "../services/DegreeService";
import { studentCertificateRegistrationService } from "../services/StudentCertificateRegistrationService";
import { studentProfileService } from "../services/StudentProfileService";
import { authStorage } from "../utils/AuthStorage";

const initialForm: StudentCertificateRegistrationRequest = {
  student_id: "",
  student_name: "",
  degree_id: 0,
  wallet_address: "",
  conferral_date: "",
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMinimumConferralDate = () => {
  const minimumDate = new Date();
  minimumDate.setDate(minimumDate.getDate() + 14);

  return formatDateForInput(minimumDate);
};

const StudentCertificateRegistrationPage = () => {
  const navigate = useNavigate();
  const [form, setForm] =
    useState<StudentCertificateRegistrationRequest>(initialForm);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [registrations, setRegistrations] = useState<StudentCertificate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minimumConferralDate = getMinimumConferralDate();

  useEffect(() => {
    const studentId = authStorage.getLoginId();

    if (!studentId) {
      setError("Student ID is missing from the login session.");
      setIsLoading(false);
      return;
    }

    Promise.all([
      degreeService.getDegrees(),
      studentProfileService.getCurrentStudentRegistrations(),
    ])
      .then(([degreeList, studentRegistrations]) => {
        setDegrees(degreeList);
        setRegistrations(studentRegistrations);

        const currentStudent = studentRegistrations[0];

        setForm((previous) => ({
          ...previous,
          student_id: studentId,
          student_name: currentStudent?.student_name ?? "",
          wallet_address: currentStudent?.wallet_address ?? "",
        }));
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load certificate registration details."
        )
      )
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (form.degree_id === 0) {
      setError("Please select a degree.");
      return;
    }

    if (!form.student_name.trim()) {
      setError("Student profile information could not be loaded.");
      return;
    }

    if (form.conferral_date < minimumConferralDate) {
      setError(
        "Conferral date must be at least 2 weeks from the current date."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        await studentCertificateRegistrationService.registerCertificate({
          ...form,
          student_name: form.student_name.trim(),
          wallet_address: form.wallet_address.trim(),
        });

      navigate("/student/dashboard", {
        replace: true,
        state: {
          message: `Certificate registration #${result.registration_id} was created successfully.`,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register the certificate."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h1 className="h3 mb-1">Certificate Registration</h1>
              <p className="text-muted mb-0">
                Register another graduation certificate for your account.
              </p>
            </div>
            <Link className="btn btn-outline-secondary" to="/student/dashboard">
              Back to Dashboard
            </Link>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {isLoading ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body">Loading registration details...</div>
            </div>
          ) : (
            <form className="card border-0 shadow-sm" onSubmit={handleSubmit}>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="student_id">
                      Student ID
                    </label>
                    <input
                      id="student_id"
                      className="form-control"
                      value={form.student_id}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="student_name">
                      Student Name
                    </label>
                    <input
                      id="student_name"
                      className="form-control"
                      value={form.student_name}
                      readOnly
                    />
                  </div>

                  <div className="col-12">
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
                      disabled={isSubmitting}
                      required
                    >
                      <option value={0}>Select a degree</option>
                      {degrees.map((degree) => (
                        <option key={degree.degree_id} value={degree.degree_id}>
                          {degree.degree_name} — {degree.university_name}
                        </option>
                      ))}
                    </select>
                    {registrations.length > 0 && (
                      <div className="form-text">
                        You already have {registrations.length} certificate
                        registration{registrations.length === 1 ? "" : "s"}.
                        The backend prevents duplicate registration for the same
                        degree.
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label" htmlFor="wallet_address">
                      Wallet Address
                    </label>
                    <input
                      id="wallet_address"
                      className="form-control"
                      value={form.wallet_address}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          wallet_address: event.target.value,
                        })
                      }
                      placeholder="0x..."
                      disabled={isSubmitting}
                      required
                    />
                    <div className="form-text">
                      The certificate NFT/token will be associated with this
                      wallet by the blockchain process.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="conferral_date">
                      Conferral Date
                    </label>
                    <input
                      id="conferral_date"
                      type="date"
                      className="form-control"
                      value={form.conferral_date}
                      min={minimumConferralDate}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          conferral_date: event.target.value,
                        })
                      }
                      disabled={isSubmitting}
                      required
                    />
                    <div className="form-text">
                      Conferral date must be at least 2 weeks from today.
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-footer bg-white border-0 px-4 pb-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Registering Certificate..."
                    : "Register Certificate"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCertificateRegistrationPage;