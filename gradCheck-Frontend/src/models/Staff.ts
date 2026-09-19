export interface StaffRegistrationRequest {
  staffId: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface StaffRegistrationResponse {
  message: string;
  staffId?: string;
}

export type RegistrationStatus =
  | "registered"
  | "pdf_generated"
  | "minted"
  | "failed";

export interface StudentCredential {
  id: number;
  certificate_id: string;
  student_id: string;
  student_name: string;
  degree_name: string;
  wallet_address: string;
  conferral_date: string;
  status: RegistrationStatus;
  pdf_hash?: string | null;
  ipfs_cid?: string | null;
  token_id?: number | null;
  mint_tx_hash?: string | null;
  last_error?: string | null;
}
