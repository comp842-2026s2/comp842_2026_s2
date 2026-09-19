import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { StudentCertificate } from "../models/Certificate";
import { studentProfileService } from "../services/StudentProfileService";

const formatStatus = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const StudentDashboardPage = () => {
  const [registrations, setRegistrations] = useState<StudentCertificate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    studentProfileService
      .getCurrentStudentRegistrations()
      .then(setRegistrations)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard."
        )
      )
      .finally(() => setIsLoading(false));
  }, []);

  const student = registrations[0] ?? null;
  const mintedCount = useMemo(
    () => registrations.filter((item) => item.status === "minted").length,
    [registrations]
  );

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Student Dashboard</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : student ? (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-7">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h2 className="h5">Student Profile</h2>
                  <p className="mb-1">
                    <strong>{student.student_name}</strong>
                  </p>
                  <p className="mb-1">Student ID: {student.student_id}</p>
                  <p className="mb-0 text-break">
                    Wallet: {student.wallet_address}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h2 className="h5">Certificates</h2>
                  <p className="mb-1">
                    Registrations: <strong>{registrations.length}</strong>
                  </p>
                  <p className="mb-3">
                    Minted: <strong>{mintedCount}</strong>
                  </p>
                  <Link className="btn btn-primary" to="/student/certificate">
                    View Certificates
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="h5">My Degree Registrations</h2>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Certificate ID</th>
                      <th>Degree</th>
                      <th>University</th>
                      <th>Conferral Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td>{registration.certificate_id}</td>
                        <td>{registration.degree_name}</td>
                        <td>{registration.university_name}</td>
                        <td>{registration.conferral_date}</td>
                        <td>{formatStatus(registration.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info">No student registrations found.</div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
