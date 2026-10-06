import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { StudentCertificate } from "../models/Certificate";
import { studentCertificateService } from "../services/StudentCertificateService";

const formatStatus = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const maskValue = (
  value: string | number | null | undefined,
  fallback: string
) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  const text = String(value);

  if (text.length <= 10) {
    return "****";
  }

  return `${text.slice(0, 6)}****${text.slice(-4)}`;
};

const StudentCertificatePage = () => {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  useEffect(() => {
    studentCertificateService
      .getCertificates()
      .then(setCertificates)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load certificates."
        )
      )
      .finally(() => setIsLoading(false));

    studentCertificateService
      .getContractAddress()
      .then(setContractAddress)
      .catch((err) =>
        console.error(
          "Unable to load contract address:",
          err
        )
      );
  }, []);

  const download = async (certificate: StudentCertificate) => {
    setDownloadingId(certificate.id);
    setError(null);

    try {
      await studentCertificateService.downloadCertificate(certificate.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container py-4">
      {contractAddress && (
        <div className="alert alert-light border shadow-sm mb-4">
          <div className="d-flex flex-column flex-md-row gap-2">
            <strong>Blockchain Contract Address:</strong>

            <span className="font-monospace text-break">
              {contractAddress}
            </span>
          </div>
        </div>
      )}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">My Graduation Certificates</h1>
        <Link
          className="btn btn-outline-primary"
          to="/student/verification-links"
        >
          Manage Verification Links
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <p>Loading certificates...</p>
      ) : certificates.length === 0 ? (
        <div className="alert alert-info">No certificates found.</div>
      ) : (
        <div className="row g-4">
          {certificates.map((certificate) => {
            const canDownload =
              certificate.status !== "pending_release" &&
              Boolean(certificate.ipfs_cid);

            return (
              <div className="col-12" key={certificate.id}>
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                      <div>
                        <h2 className="h5 mb-1">{certificate.degree_name}</h2>
                        <p className="text-muted mb-0">
                          {certificate.university_name}
                        </p>
                      </div>
                      <span className="badge text-bg-secondary align-self-start">
                        {formatStatus(certificate.status)}
                      </span>
                    </div>

                    <dl className="row mb-4">
                      <dt className="col-sm-4">Certificate ID</dt>
                      <dd className="col-sm-8">{certificate.certificate_id}</dd>

                      <dt className="col-sm-4">Conferral Date</dt>
                      <dd className="col-sm-8">{certificate.conferral_date}</dd>

                      <dt className="col-sm-4">Wallet Address</dt>
                      <dd className="col-sm-8 text-break">
                        {maskValue(
                          certificate.wallet_address,
                          "Not available"
                        )}
                      </dd>

                      <dt className="col-sm-4">PDF Hash</dt>
                      <dd className="col-sm-8 text-break">
                        {maskValue(
                          certificate.pdf_hash,
                          "Not available yet"
                        )}
                      </dd>

                      <dt className="col-sm-4">NFT Token ID</dt>
                      <dd className="col-sm-8 text-break">
                        {certificate.token_id ?? "Not minted yet"}
                      </dd>

                      <dt className="col-sm-4">Mint Transaction Hash</dt>
                      <dd className="col-sm-8 text-break">
                        {maskValue(
                          certificate.mint_tx_hash,
                          "Not available"
                        )}
                      </dd>

                      <dt className="col-sm-4">Minted At</dt>
                      <dd className="col-sm-8">
                        {certificate.minted_at
                          ? new Date(certificate.minted_at).toLocaleString()
                          : "Not minted yet"}
                      </dd>
                    </dl>

                    {certificate.status === "pending_release" && (
                      <div className="alert alert-info">
                        This certificate has not reached its conferral date yet.
                        Verification and blockchain details are hidden until it
                        is released.
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => download(certificate)}
                      disabled={!canDownload || downloadingId !== null}
                    >
                      {downloadingId === certificate.id
                        ? "Downloading..."
                        : "Download Certificate PDF"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCertificatePage;
