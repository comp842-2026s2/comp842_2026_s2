import { useEffect, useState } from "react";
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

  const handleMint = async () => {
    const confirmed = window.confirm(
      "Mint Soulbound Tokens for all students whose certificates have been generated?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await staffService.mintTokens();

      setMessage(
        response.message ||
          "Minting process completed."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Minting process failed."
      );
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <h1>Admin / Minting Dashboard</h1>

          <p>
            Monitor certificate generation and
            Soulbound Token minting.
          </p>
        </div>

        <button
          className="gradcheck-mint-button"
          onClick={handleMint}
          disabled={
            loading || pdfGenerated === 0
          }
        >
          {loading
            ? "Minting..."
            : "Mint Tokens"}
        </button>
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
        <table className="gradcheck-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Degree</th>
              <th>Wallet</th>
              <th>PDF</th>
              <th>Mint Status</th>
              <th>Token ID</th>
              <th>Transaction</th>
              <th>Error</th>
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

                <td className="gradcheck-hash-cell">
                  {student.mint_tx_hash || "-"}
                </td>

                <td>
                  {student.last_error || "-"}
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