import { useEffect, useState } from "react";
import { staffService } from "../services/StaffRegistrationService";
import type { StudentCredential } from "../models/Staff";

function CertificateGeneration() {
  const [students, setStudents] = useState<
    StudentCredential[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRegistrations = async () => {
    try {
      const data =
        await staffService.getRegistrations();

      setStudents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load registrations"
      );
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const handleGenerate = async () => {
    const confirmed = window.confirm(
      "Generate certificates for all registered students?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await staffService.generateCertificates();

      setMessage(
        response.message ||
          "Certificate generation completed."
      );

      await loadRegistrations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "PDF generation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const registeredCount = students.filter(
    (student) =>
      student.status === "registered"
  ).length;

  const generatedCount = students.filter(
    (student) =>
      student.status === "pdf_generated"
  ).length;

  return (
    <div className="certificate-page">
      <div className="gradcheck-page-header">
        <div>
          <h1>Certificate & Token Generation</h1>

          <p>
            Generate degree certificates for
            registered graduation students.
          </p>
        </div>

        <button
          className="gradcheck-primary-button"
          onClick={handleGenerate}
          disabled={
            loading || registeredCount === 0
          }
        >
          {loading
            ? "Generating..."
            : "Generate PDF"}
        </button>
      </div>

      <div className="gradcheck-summary-grid">
        <div className="gradcheck-summary-card">
          <span>Registered</span>
          <strong>{registeredCount}</strong>
        </div>

        <div className="gradcheck-summary-card">
          <span>PDF Generated</span>
          <strong>{generatedCount}</strong>
        </div>

        <div className="gradcheck-summary-card">
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </div>
      </div>

      {message && (
        <div className="gradcheck-success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="gradcheck-error-message">
          {error}
        </div>
      )}

      <div className="gradcheck-table-container">
        <table className="gradcheck-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Degree</th>
              <th>Status</th>
              <th>PDF Hash</th>
              <th>IPFS CID</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.student_id}</td>

                <td>{student.student_name}</td>

                <td>{student.degree_name}</td>

                <td>
                  <span
                    className={`gradcheck-status gradcheck-status-${student.status}`}
                  >
                    {student.status}
                  </span>
                </td>

                <td className="gradcheck-hash-cell">
                  {student.pdf_hash || "-"}
                </td>

                <td className="hash-cell">
                  {student.ipfs_cid || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CertificateGeneration;