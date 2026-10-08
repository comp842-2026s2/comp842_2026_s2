import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type {
  DocumentVerificationResult,
  VerificationLinkInvalidReason,
  VerificationLinkValidation,
} from "../models/PublicVerification";

import { publicVerificationService } from "../services/PublicVerificationService";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const reasonMessage = (reason?: VerificationLinkInvalidReason): string => {
  switch (reason) {
    case "expired":
      return "This verification link has expired.";
    case "revoked":
      return "This verification link has been revoked.";
    case "not_found":
      return "This verification link is invalid.";
    default:
      return "This verification link cannot be used.";
  }
};

const PublicVerifyCertificatePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [linkValidation, setLinkValidation] =
    useState<VerificationLinkValidation | null>(null);

  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [verificationResult, setVerificationResult] =
    useState<DocumentVerificationResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isValidatingLink, setIsValidatingLink] = useState(true);

  const [isVerifyingDocument, setIsVerifyingDocument] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const validateLink = async () => {
      setError(null);
      setLinkValidation(null);
      setVerificationResult(null);
      setCertificateFile(null);

      if (!token) {
        setError("The verification token is missing from the URL.");
        setIsValidatingLink(false);
        return;
      }

      setIsValidatingLink(true);

      try {
        const result = await publicVerificationService.validateLink(token);

        if (!isCancelled) {
          setLinkValidation(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to validate the verification link.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsValidatingLink(false);
        }
      }
    };

    validateLink();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setVerificationResult(null);

    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setCertificateFile(null);
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      event.target.value = "";
      setCertificateFile(null);
      setError("Please select a PDF certificate file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      event.target.value = "";
      setCertificateFile(null);
      setError("The certificate PDF must not exceed 10 MB.");
      return;
    }

    setCertificateFile(selectedFile);
  };

  const handleVerifyDocument = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);
    setVerificationResult(null);

    if (!linkValidation?.valid) {
      setError("The verification link is not valid.");
      return;
    }

    if (!certificateFile) {
      setError("Please select the certificate PDF to verify.");
      return;
    }

    setIsVerifyingDocument(true);

    try {
      const result =
        await publicVerificationService.verifyDocument(certificateFile);

      setVerificationResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the certificate.",
      );
    } finally {
      setIsVerifyingDocument(false);
    }
  };

  if (isValidatingLink) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 text-center">
            <div
              className="spinner-border"
              role="status"
              aria-label="Validating verification link"
            />
            <p className="mt-3 mb-0">Validating verification link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !linkValidation) {
    return <UnavailableMessage message={error} />;
  }

  if (linkValidation && !linkValidation.valid) {
    return (
      <UnavailableMessage message={reasonMessage(linkValidation.reason)} />
    );
  }

  if (!linkValidation?.valid || !linkValidation.certificate) {
    return (
      <UnavailableMessage message="The verification link cannot be used." />
    );
  }

  const certificate = linkValidation.certificate;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white py-3">
              <h1 className="h4 mb-0">Certificate Verification</h1>
            </div>

            <div className="card-body p-4">
              <div className="alert alert-success" role="status">
                <strong>Verification link is valid.</strong>
                {linkValidation.expires_at && (
                  <>
                    {" "}
                    This link expires on{" "}
                    {new Date(linkValidation.expires_at).toLocaleString()}.
                  </>
                )}
              </div>

              <div className="border rounded bg-light p-3 mb-4">
                <h2 className="h6 mb-3">Certificate Details</h2>

                <dl className="row mb-0">
                  <dt className="col-sm-4">Student Name</dt>
                  <dd className="col-sm-8">{certificate.student_name}</dd>

                  {/*                   <dt className="col-sm-4">
                    Student ID
                  </dt>
                  <dd className="col-sm-8">
                    {certificate.student_id}
                  </dd>
 */}
                  <dt className="col-sm-4">Degree Name</dt>
                  <dd className="col-sm-8">{certificate.degree_name}</dd>

                  <dt className="col-sm-4">Graduation Date</dt>
                  <dd className="col-sm-8">{certificate.conferral_date}</dd>
                </dl>
              </div>

              <p>
                Upload the certificate PDF supplied by the student. GradCheck
                will hash the uploaded document and validate it against the
                credential recorded on the blockchain.
              </p>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyDocument}>
                <div className="mb-3">
                  <label htmlFor="certificate-file" className="form-label">
                    Certificate PDF
                  </label>

                  <input
                    id="certificate-file"
                    type="file"
                    className="form-control"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={isVerifyingDocument}
                    required
                  />

                  <div className="form-text">
                    PDF only. Maximum file size: 10 MB.
                  </div>
                </div>

                {certificateFile && (
                  <div className="mb-3">
                    <small className="text-muted">
                      Selected file: {certificateFile.name}
                    </small>
                  </div>
                )}

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!certificateFile || isVerifyingDocument}
                  >
                    {isVerifyingDocument
                      ? "Verifying Certificate..."
                      : "Verify Certificate"}
                  </button>
                </div>
              </form>

              {verificationResult && (
                <VerificationResult result={verificationResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnavailableMessage = ({ message }: { message: string }) => (
  <div className="container py-5">
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="alert alert-danger" role="alert">
          <h1 className="h5">Verification Link Unavailable</h1>
          <p className="mb-0">{message}</p>
        </div>
      </div>
    </div>
  </div>
);

const MASKED_FIELDS = new Set([
  "documentCID",
  "documentHash",
  "recipient",
  "tokenURI",
]);

const maskValue = (
  value: unknown,
  visibleStart = 6,
  visibleEnd = 4,
): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value);

  if (text.length <= visibleStart + visibleEnd) {
    return "****";
  }

  return `${text.slice(0, visibleStart)}****${text.slice(-visibleEnd)}`;
};

const displayResultValue = (key: string, value: unknown): string => {
  if (key === "graduationDate") {
    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toISOString().slice(0, 10);
  }

  return MASKED_FIELDS.has(key) ? maskValue(value) : String(value);
};

const VerificationResult = ({
  result,
}: {
  result: DocumentVerificationResult;
}) => {
  if (!result.verified) {
    return (
      <div className="alert alert-danger mt-4 mb-0" role="status">
        <h2 className="h5">Verification Failed</h2>
        <p className="mb-0">
          The uploaded PDF does not match a credential recorded on the
          blockchain.
        </p>
      </div>
    );
  }

  const visibleFields = [
    { key: "studentName", label: "Student Name" },
    { key: "degreeName", label: "Degree Name" },
    { key: "graduationDate", label: "Graduation Date" },
  ] as const;

  const details = visibleFields
    .map(({ key, label }) => {
      const value = result[key];

      if (value === null || value === undefined || typeof value === "object") {
        return null;
      }

      return { key, label, value };
    })
    .filter((detail) => detail !== null);

  return (
    <div className="alert alert-success mt-4 mb-0" role="status">
      <h2 className="h5">Certificate Verified</h2>

      <p>The uploaded PDF matches a credential recorded on the blockchain.</p>

      {details.length > 0 && (
        <dl className="row mb-0">
          {details.map(({ key, label, value }) => (
            <div className="row" key={key}>
              <dt className="col-sm-4">{label}</dt>
              <dd className="col-sm-8 text-break">
                {displayResultValue(key, value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default PublicVerifyCertificatePage;
