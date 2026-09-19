export type CertificateStatus =
  | "registered"
  | "pdf_generated"
  | "minted"
  | "failed"
  | "pending_release";

/**
 * Shape returned by GET /students/{studentid} and
 * GET /students/{studentid}/certificate.
 *
 * `id` is the certificates table row id. The backend still refers to this
 * value as registration_id in verification-link and download APIs.
 */
export interface StudentCertificate {
  id: number;
  certificate_id: string;
  student_id: string;
  student_name: string;
  degree_name: string;
  university_name: string;
  wallet_address: string;
  conferral_date: string;
  status: CertificateStatus;
  pdf_hash: string | null;
  ipfs_cid: string | null;
  token_id: string | null;
  mint_tx_hash: string | null;
  minted_at: string | null;
  registered_at: string;
}
