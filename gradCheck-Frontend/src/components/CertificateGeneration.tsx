import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { staffService } from "../services/StaffRegistrationService";
import type { StudentCredential } from "../models/Staff";

export interface CertificateGenerationProps {
  // Connect these to student-specific service methods. The existing
  // generateCertificates() and mintTokens() methods process ALL eligible rows.
  generatePdf?: (registrationId: StudentCredential["id"]) => Promise<unknown>;
  generateToken?: (registrationId: StudentCredential["id"]) => Promise<unknown>;
}

const hasToken = (student: StudentCredential) =>
  student.token_id != null || student.status === "minted";

const hasPdf = (student: StudentCredential) =>
  Boolean(student.pdf_hash) || student.status === "pdf_generated" || hasToken(student);

function CertificateGeneration({ generatePdf, generateToken }: CertificateGenerationProps = {}) {
  const [students, setStudents] = useState<StudentCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<{ id: StudentCredential["id"]; action: "pdf" | "token" } | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const handleGenerate = async (student: StudentCredential, action: "pdf" | "token") => {
    if (busy.current || loading || hasToken(student)) return;
    if (action === "pdf" && hasPdf(student)) return;
    if (action === "token" && !hasPdf(student)) return;
    const generate = action === "pdf" ? generatePdf : generateToken;
    if (!generate) return;

    busy.current = true;
    setActive({ id: student.id, action });
    setError("");
    setMessage("");
    try {
      await generate(student.id);
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

  const integrationMessage = !generatePdf || !generateToken
    ? "Individual generation is not connected yet. Student-specific service methods are required to enable the corresponding actions."
    : "";

  return (
    <div className="certificate-page">
      <div className="gradcheck-page-header certificate-generation-header">
        <Link to="/staff" className="back-button">← Back</Link>
        <div className="certificate-generation-heading">
          <h1>Certificate &amp; Token Generation</h1>
          <p><strong>Note:</strong> Staff must generate each student’s PDF certificate before minting their token.</p>
        </div>
      </div>

      <div aria-label="Generation messages">
        {error && <p className="gradcheck-error-message" role="alert">{error}</p>}
        {message && <p className="gradcheck-success-message" role="status">{message}</p>}
        {integrationMessage && <p id="generation-integration" className="gradcheck-error-message" role="status">{integrationMessage}</p>}
      </div>

      <div className="gradcheck-table-container" aria-busy={loading || active !== null}>
        <table className="gradcheck-table gradcheck-column-separators" aria-label="Student certificate and token generation">
          <thead><tr>
            <th scope="col">Student ID</th><th scope="col">Student Name</th><th scope="col">Degree</th>
              <th>Status</th><th scope="col">PDF</th><th scope="col">Token</th>
          </tr></thead>
          <tbody>
            {/* Static preview row; no service calls are made for this sample. */}
            <tr key="sample-student">
              <td>S001</td>
              <td>Alice (Sample)</td>
              <td>Master’s Degree</td>
              <td>PDF Generated</td>
              <td>
                <button type="button" className="gradcheck-primary-button" disabled title="Sample row only">
                  Generate PDF
                </button>
              </td>
              <td>
                <button type="button" className="gradcheck-primary-button" disabled title="Sample row only">
                  Mint Token
                </button>
              </td>
            </tr>
            {loading ? <tr><td colSpan={5} className="gradcheck-empty-state">Loading registrations…</td></tr> : students.length === 0 ? <tr><td colSpan={5} className="gradcheck-empty-state">{error ? "Registrations could not be loaded." : "No registrations found."}</td></tr> : students.map((student) => (
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
                <td>{hasPdf(student) ? <span>Generated</span> : (
                  <button type="button" className="gradcheck-primary-button" disabled={active !== null || !generatePdf} aria-describedby={!generatePdf ? "generation-integration" : undefined} aria-label={`Generate PDF for ${student.student_name}`} onClick={() => void handleGenerate(student, "pdf")}>
                    {active?.id === student.id && active.action === "pdf" ? "Generating…" : "Generate PDF"}
                  </button>
                )}</td>
                <td>{hasToken(student) ? <span>{student.token_id != null ? `Token ${student.token_id}` : "Generated"}</span> : (
                  <button type="button" className="gradcheck-primary-button" disabled={active !== null || !hasPdf(student) || !generateToken} aria-describedby={!generateToken ? "generation-integration" : undefined} title={!hasPdf(student) ? "Generate the PDF first." : undefined} aria-label={`Mint Token for ${student.student_name}`} onClick={() => void handleGenerate(student, "token")}>
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
