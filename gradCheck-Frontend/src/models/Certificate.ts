export type CertificateStatus =
  | "registered"
  | "pdf_generated"
  | "minted"
  | "failed"
  | "pending_release";

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

export interface StudentCertificateRegistrationRequest {
  student_id: string;
  student_name: string;
  degree_id: number;
  wallet_address: string;
  conferral_date: string;
}

export interface StudentCertificateRegistrationResponse {
  registration_id: number;
  status: "registered" | string;
  login_created: boolean;
}