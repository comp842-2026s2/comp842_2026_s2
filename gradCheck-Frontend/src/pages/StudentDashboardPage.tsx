import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { StudentCertificate } from "../models/Certificate";
import type { StudentProfile } from "../models/Student";
import { studentCertificateService } from "../services/StudentCertificateService";
import { studentProfileService } from "../services/StudentProfileService";

const StudentDashboardPage = () => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [certificate, setCertificate] = useState<StudentCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      studentProfileService.getCurrentStudent(),
      studentCertificateService.getCertificate(),
    ])
      .then(([profile, cert]) => {
        setStudent(profile);
        setCertificate(cert);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load dashboard.")
      );
  }, []);

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Student Dashboard</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h2 className="h5">Student Profile</h2>
              {student ? (
                <>
                  <p className="mb-1"><strong>{student.student_name}</strong></p>
                  <p className="mb-1">Student ID: {student.student_id}</p>
                  <p className="mb-1">Degree: {student.degree_name ?? student.degree_id}</p>
                  <p className="mb-0 text-break">Wallet: {student.wallet_address}</p>
                </>
              ) : (
                <p className="text-muted mb-0">Loading profile...</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h2 className="h5">Graduation Certificate</h2>
              <p className="mb-3">
                Status: <strong>{certificate?.status ?? "Loading..."}</strong>
              </p>
              <Link className="btn btn-primary" to="/student/certificate">
                View Certificate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
