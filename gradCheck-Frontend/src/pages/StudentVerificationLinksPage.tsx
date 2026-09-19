import { useEffect, useMemo, useState } from "react";
import type { StudentCertificate } from "../models/Certificate";
import type {
  VerificationLinkDurationDays,
  VerificationLinkSummary,
} from "../models/VerificationLink";
import { studentCertificateService } from "../services/StudentCertificateService";
import { verificationLinkService } from "../services/VerificationLinkService";

const durations: Array<{
  label: string;
  value: VerificationLinkDurationDays;
}> = [
  { label: "24 hours", value: 1 },
  { label: "5 days", value: 5 },
  { label: "10 days", value: 10 },
  { label: "20 days", value: 20 },
  { label: "30 days", value: 30 },
];

const getStatus = (link: VerificationLinkSummary) => {
  if (link.revoked) return "Revoked";
  if (new Date(link.expires_at).getTime() <= Date.now()) return "Expired";
  return "Active";
};

const StudentVerificationLinksPage = () => {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [links, setLinks] = useState<VerificationLinkSummary[]>([]);
  const [registrationId, setRegistrationId] = useState<number>(0);
  const [duration, setDuration] = useState<VerificationLinkDurationDays>(1);
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const eligibleCertificates = useMemo(
    () => certificates.filter((certificate) => certificate.status === "minted"),
    [certificates]
  );

  const certificateByRegistrationId = useMemo(
    () => new Map(certificates.map((certificate) => [certificate.id, certificate])),
    [certificates]
  );

  const load = async () => {
    const [certificateRows, existingLinks] = await Promise.all([
      studentCertificateService.getCertificates(),
      verificationLinkService.getLinks(),
    ]);

    setCertificates(certificateRows);
    setLinks(existingLinks);

    const firstMinted = certificateRows.find(
      (certificate) => certificate.status === "minted"
    );

    setRegistrationId((current) => current || firstMinted?.id || 0);
  };

  useEffect(() => {
    load()
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load verification links."
        )
      )
      .finally(() => setIsLoading(false));
  }, []);

  const createLink = async () => {
    if (!registrationId) {
      setError("Please select a minted certificate.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setCopyMessage(null);
    setNewShareUrl(null);

    try {
      const created = await verificationLinkService.createLink({
        registration_id: registrationId,
        expires_in_days: duration,
      });

      const shareUrl = `${window.location.origin}/verify?token=${encodeURIComponent(
        created.token
      )}`;

      setNewShareUrl(shareUrl);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create link.");
    } finally {
      setIsCreating(false);
    }
  };

  const revoke = async (id: number) => {
    setRevokingId(id);
    setError(null);

    try {
      await verificationLinkService.revokeLink(id);
      setLinks((previous) =>
        previous.map((link) =>
          link.id === id ? { ...link, revoked: true } : link
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke link.");
    } finally {
      setRevokingId(null);
    }
  };

  const copyNewLink = async () => {
    if (!newShareUrl) return;

    await navigator.clipboard.writeText(newShareUrl);
    setCopyMessage("Verification link copied.");
  };

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Certificate Verification Links</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {newShareUrl && (
        <div className="alert alert-success">
          <p className="fw-semibold mb-2">Verification link created.</p>
          <p className="mb-2">
            Copy this link now. For security, the backend stores only a hash of
            the token, so the complete link cannot be retrieved later.
          </p>
          <div className="input-group">
            <input
              className="form-control"
              value={newShareUrl}
              readOnly
              aria-label="New verification link"
            />
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={copyNewLink}
            >
              Copy
            </button>
          </div>
          {copyMessage && <small className="d-block mt-2">{copyMessage}</small>}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5">Create Temporary Link</h2>
          <p className="text-muted">
            Select the certificate and how long the verification link should
            remain valid.
          </p>

          {isLoading ? (
            <p className="mb-0">Loading certificates...</p>
          ) : eligibleCertificates.length === 0 ? (
            <div className="alert alert-info mb-0">
              A verification link can be generated once a certificate has been
              minted.
            </div>
          ) : (
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label" htmlFor="certificate-selection">
                  Certificate
                </label>
                <select
                  id="certificate-selection"
                  className="form-select"
                  value={registrationId}
                  onChange={(event) =>
                    setRegistrationId(Number(event.target.value))
                  }
                >
                  {eligibleCertificates.map((certificate) => (
                    <option key={certificate.id} value={certificate.id}>
                      {certificate.certificate_id} — {certificate.degree_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="link-duration">
                  Link validity
                </label>
                <select
                  id="link-duration"
                  className="form-select"
                  value={duration}
                  onChange={(event) =>
                    setDuration(
                      Number(event.target.value) as VerificationLinkDurationDays
                    )
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
                  type="button"
                  className="btn btn-primary"
                  onClick={createLink}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Generate Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5">Generated Link History</h2>
          <p className="text-muted">
            Existing link tokens are not returned by the API. This history shows
            when each link was created, when it expires, and whether it has been
            revoked.
          </p>

          {isLoading ? (
            <p className="mb-0">Loading links...</p>
          ) : links.length === 0 ? (
            <p className="text-muted mb-0">
              No verification links generated yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Certificate</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const certificate = certificateByRegistrationId.get(
                      link.registration_id
                    );
                    const status = getStatus(link);
                    const canRevoke = status === "Active";

                    return (
                      <tr key={link.id}>
                        <td>
                          {certificate
                            ? `${certificate.certificate_id} — ${certificate.degree_name}`
                            : `Registration #${link.registration_id}`}
                        </td>
                        <td>{new Date(link.created_at).toLocaleString()}</td>
                        <td>{new Date(link.expires_at).toLocaleString()}</td>
                        <td>{status}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => revoke(link.id)}
                            disabled={!canRevoke || revokingId !== null}
                          >
                            {revokingId === link.id ? "Revoking..." : "Revoke"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
