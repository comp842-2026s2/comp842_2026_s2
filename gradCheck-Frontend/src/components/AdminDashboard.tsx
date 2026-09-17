import { useEffect, useState } from "react";
import { Link } from "react-router";
import { staffService } from "../services/StaffRegistrationService";
import type { StudentCredential } from "../models/Staff";

function AdminDashboard() {
  const [students, setStudents] = useState<
    StudentCredential[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const data =
        await staffService.getRegistrations();

      setStudents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard"
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = students.length;

  const registered = students.filter(
    (s) => s.status === "registered"
  ).length;

  const pdfGenerated = students.filter(
    (s) => s.status === "pdf_generated"
  ).length;

  const minted = students.filter(
    (s) => s.status === "minted"
  ).length;

  const failed = students.filter(
    (s) => s.status === "failed"
  ).length;

  return (
    <div className="admin-dashboard">
      <div className="gradcheck-page-header">
        <Link to="/staff" className="back-button">
            ← Back
          </Link>
        <div style={{ flex: 1, textAlign: "center" }}>
          <h1>Admin Dashboard</h1>

          <p>
            Monitor certificate generation and
            Soulbound Token minting.
          </p>
        </div>

        <Link to="/staff/certificates">
                 → Generate Certs and Tokens
        </Link>
      </div>

      <div className="gradcheck-summary-grid">
        <div className="gradcheck-summary-card">
          <span>Total</span>
          <strong>{total}</strong>
        </div>

        <div className="gradcheck-summary-card">
          <span>Registered</span>
          <strong>{registered}</strong>
        </div>

        <div className="gradcheck-summary-card">
          <span>PDF Generated</span>
          <strong>{pdfGenerated}</strong>
        </div>

        <div className="gradcheck-summary-card">
          <span>Minted</span>
          <strong>{minted}</strong>
        </div>

        <div className="gradcheck-summary-card">
          <span>Failed</span>
          <strong>{failed}</strong>
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
        <table className="gradcheck-table gradcheck-column-separators">
          <thead>
            <tr>
              <th>Student</th>
              <th>Degree</th>
              <th>Wallet</th>
              <th>PDF</th>
              <th>Mint Status</th>
              <th>Token ID</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  <strong>
                    {student.student_name}
                  </strong>
                  <br />
                  <small>
                    {student.student_id}
                  </small>
                </td>

                <td>{student.degree_name}</td>

                <td className="gradcheck-hash-cell">
                  {student.wallet_address}
                </td>

                <td>
                  {student.pdf_hash
                    ? "Generated"
                    : "Pending"}
                </td>

                <td>
                  <span
                    className={`gradcheck-status gradcheck-status-${student.status}`}
                  >
                    {student.status}
                  </span>
                </td>

                <td>
                  {student.token_id ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;