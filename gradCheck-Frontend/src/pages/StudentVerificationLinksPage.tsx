import { useEffect, useState } from "react";
import type { StudentCertificate } from "../models/Certificate";
import type {
  VerificationLink,
  VerificationLinkDurationDays,
} from "../models/VerificationLink";
import { studentCertificateService } from "../services/StudentCertificateService";
import { verificationLinkService } from "../services/VerificationLinkService";

const durations: Array<{ label: string; value: VerificationLinkDurationDays }> = [
  { label: "24 hours", value: 1 },
  { label: "5 days", value: 5 },
  { label: "10 days", value: 10 },
  { label: "20 days", value: 20 },
  { label: "30 days", value: 30 },
];

const StudentVerificationLinksPage = () => {
  const [certificate, setCertificate] = useState<StudentCertificate | null>(null);
  const [links, setLinks] = useState<VerificationLink[]>([]);
  const [duration, setDuration] = useState<VerificationLinkDurationDays>(1);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    const [cert, existingLinks] = await Promise.all([
      studentCertificateService.getCertificate(),
      verificationLinkService.getLinks(),
    ]);
    setCertificate(cert);
    setLinks(existingLinks);
  };

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Unable to load verification links.")
    );
  }, []);

  const createLink = async () => {
    if (!certificate) return;

    setIsCreating(true);
    setError(null);

    try {
      const link = await verificationLinkService.createLink({
        certificate_id: certificate.certificate_id,
        duration_days: duration,
      });
      setLinks((previous) => [link, ...previous]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create link.");
    } finally {
      setIsCreating(false);
    }
  };

  const revoke = async (id: number) => {
    try {
      await verificationLinkService.revokeLink(id);
      setLinks((previous) =>
        previous.map((link) =>
          link.id === id ? { ...link, is_active: false } : link
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke link.");
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Certificate Verification Links</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5">Create Temporary Link</h2>
          <p className="text-muted">
            Share this link together with your certificate PDF. The recipient must
            upload the PDF through the valid link to verify it.
          </p>

          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label" htmlFor="link-duration">
                Link validity
              </label>
              <select
                id="link-duration"
                className="form-select"
                value={duration}
                onChange={(e) =>
                  setDuration(Number(e.target.value) as VerificationLinkDurationDays)
                }
              >
                {durations.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <button
                className="btn btn-primary"
                onClick={createLink}
                disabled={!certificate || certificate.status !== "minted" || isCreating}
              >
                {isCreating ? "Creating..." : "Generate Link"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5">Generated Links</h2>

          {links.length === 0 ? (
            <p className="text-muted mb-0">No verification links generated yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Verification Link</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id}>
                      <td className="text-break">{link.verification_url}</td>
                      <td>{new Date(link.expires_at).toLocaleString()}</td>
                      <td>{link.is_active ? "Active" : "Revoked / Expired"}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => copyLink(link.verification_url)}
                            disabled={!link.is_active}
                          >
                            Copy
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => revoke(link.id)}
                            disabled={!link.is_active}
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentVerificationLinksPage;
