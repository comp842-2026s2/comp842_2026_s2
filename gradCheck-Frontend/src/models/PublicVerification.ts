export interface PublicCertificateSummary {
  id: number;
  certificate_id?: string | number;
  student_id: string;
  student_name: string;
  degree_name: string;
  conferral_date: string;
  status: string;

  pdf_hash?: string | null;
  ipfs_cid?: string | null;
  token_id?: string | number | null;
  mint_tx_hash?: string | null;
  minted_at?: string | null;
}

export type VerificationLinkInvalidReason =
  | "not_found"
  | "revoked"
  | "expired";

export interface VerificationLinkValidation {
  valid: boolean;
  reason?: VerificationLinkInvalidReason;
  expires_at?: string;
  certificate?: PublicCertificateSummary;
}

export interface DocumentVerificationResult {
  verified: boolean;
  [key: string]: unknown;
}
