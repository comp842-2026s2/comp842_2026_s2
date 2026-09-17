import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { StudentCertificate } from "../models/Certificate";
import { studentCertificateService } from "../services/StudentCertificateService";

const StudentCertificatePage = () => {
  const [certificate, setCertificate] = useState<StudentCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    studentCertificateService
      .getCertificate()
      .then(setCertificate)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load certificate.")
      );
  }, []);

  const download = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await studentCertificateService.downloadCertificate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!certificate && !error) {
    return <div className="container py-4">Loading certificate...</div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">My Graduation Certificate</h1>
        <Link className="btn btn-outline-primary" to="/student/verification-links">
          Manage Verification Links
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {certificate && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <dl className="row mb-4">
              <dt className="col-sm-4">Student</dt>
              <dd className="col-sm-8">{certificate.student_name}</dd>
              <dt className="col-sm-4">Degree</dt>
              <dd className="col-sm-8">{certificate.degree_name}</dd>
              <dt className="col-sm-4">Issue Date</dt>
              <dd className="col-sm-8">{certificate.issue_date}</dd>
              <dt className="col-sm-4">Status</dt>
              <dd className="col-sm-8">{certificate.status}</dd>
              <dt className="col-sm-4">NFT Token ID</dt>
              <dd className="col-sm-8 text-break">{certificate.token_id ?? "Not minted yet"}</dd>
              <dt className="col-sm-4">Transaction Hash</dt>
              <dd className="col-sm-8 text-break">{certificate.transaction_hash ?? "Not available"}</dd>
            </dl>

            <button
              className="btn btn-primary"
              onClick={download}
              disabled={certificate.status !== "minted" || isDownloading}
            >
              {isDownloading ? "Downloading..." : "Download Certificate PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificatePage;
