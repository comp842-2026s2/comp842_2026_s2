import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { staffService } from "../services/StaffRegistrationService";
import type { StudentCredential } from "../models/Staff";

const isTokenGenerated = (student: StudentCredential) =>
  Boolean(student.mint_tx_hash) ; //|| student.token_id != null || student.status === "minted"
const isPdfGenerated = (student: StudentCredential) =>
  Boolean(student.pdf_hash) || isTokenGenerated(student); //|| student.status === "pdf_generated" 

function CertificateGeneration() {
  const [students, setStudents] = useState<StudentCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<{ id: StudentCredential["id"]; action: "pdf" | "token" } | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = () => staffService.getRegistrations().then((data) => { if (mounted.current) setStudents(data); });

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    staffService.getRegistrations()
      .then((data) => { if (!cancelled) setStudents(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load registrations.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; mounted.current = false; };
  }, []);

  const handleBulkGeneratePdf = async () => {
    if (busy.current || bulkGenerating) return;
    busy.current = true;
    setBulkGenerating(true);
    setError("");
    setMessage("");
    try {
      const result = await staffService.generateCertificates();
      setMessage(`Processed ${result.processed} registration(s).`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      busy.current = false;
      if (mounted.current) setBulkGenerating(false);
    }
  };

  const handleGenerate = async (student: StudentCredential, action: "pdf" | "token") => {
    if (busy.current || loading) return;
    if (action === "pdf" && isPdfGenerated(student)) return;
    if (action === "token" && (isTokenGenerated(student) || !isPdfGenerated(student))) return;
    busy.current = true;
    setActive({ id: student.id, action });
    setError("");
    setMessage("");
     console.log("Generation request:", { action, certificateId: student.certificate_id, registrationId: student.id });
    try {
      if (action === "pdf") {
        await staffService.generatePdf(student.certificate_id);
      } else {
        await staffService.generateToken(student.certificate_id);
      }
      if (!mounted.current) return;
      setMessage(`${action === "pdf" ? "PDF" : "Token"} generation request completed for ${student.student_name}.`);
      try {
        const data = await staffService.getRegistrations();
        if (mounted.current) setStudents(data);
      } catch (err) {
        if (mounted.current) setError(`The request completed, but the list could not be refreshed. Reload before trying again. ${err instanceof Error ? err.message : ""}`);
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : `${action === "pdf" ? "PDF" : "Token"} generation failed.`);
    } finally {
      busy.current = false;
      if (mounted.current) setActive(null);
    }
  };

  return (
    <div className="certificate-page">
      <div className="gradcheck-page-header certificate-generation-header">
        <Link to="/staff/home" className="back-button">← Back</Link>
        <div className="certificate-generation-heading">
          <h1>Certificate &amp; Token Generation</h1>
          <p><strong>Note:</strong> Staff must generate each student’s PDF certificate before minting their token.</p>
        </div>
        <button
          type="button"
          className="gradcheck-primary-button"
          onClick={() => void handleBulkGeneratePdf()}
          disabled={bulkGenerating || loading}
        >
          {bulkGenerating ? "Generating…" : "Generate PDF (all pending)"}
        </button>
      </div>

      <div aria-label="Generation messages">
        {error && <p className="gradcheck-error-message" role="alert">{error}</p>}
        {message && <p className="gradcheck-success-message" role="status">{message}</p>}
      </div>

      <div className="gradcheck-table-container" aria-busy={loading || active !== null}>
        <table className="gradcheck-table gradcheck-column-separators" aria-label="Student certificate and token generation">
          <thead><tr>
            <th scope="col">Student ID</th><th scope="col">Student Name</th><th scope="col">Programme</th>
              <th>Status</th><th scope="col">PDF</th><th scope="col">Token</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="gradcheck-empty-state">Loading registrations…</td></tr> : students.length === 0 ? <tr><td colSpan={6} className="gradcheck-empty-state">{error ? "Registrations could not be loaded." : "No registrations found."}</td></tr> : students.map((student) => (
              <tr key={student.id}>
                <td>{student.student_id}</td>
                <td>{student.student_name}{student.last_error && <span className="gradcheck-error-message">{student.last_error}</span>}</td>
                <td>{student.degree_name}</td>
                <td>
                  <span
                    className={`gradcheck-status gradcheck-status-${student.status}`}
                  >
                    {student.status}
                  </span>
                </td>
                <td>{isPdfGenerated(student) ? <span>Generated</span> : (
                  <button type="button" className="gradcheck-primary-button" disabled={active !== null} aria-label={`Generate PDF for ${student.student_name}`} onClick={() => void handleGenerate(student, "pdf")}>
                    {active?.id === student.id && active.action === "pdf" ? "Generating…" : "Generate PDF"}
                  </button>

                )}</td>
                <td>{isTokenGenerated(student) ? <span>{student.token_id != null ? `Token ${student.token_id}` : "Generated"}</span> : (
                  <button type="button" className="gradcheck-primary-button" disabled={active !== null || !isPdfGenerated(student)} title={!isPdfGenerated(student) ? "Generate the PDF first." : undefined} aria-label={`Mint Token for ${student.student_name}`} onClick={() => void handleGenerate(student, "token")}>
                    {active?.id === student.id && active.action === "token" ? "Generating…" : "Mint Token"}
                  </button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CertificateGeneration;
