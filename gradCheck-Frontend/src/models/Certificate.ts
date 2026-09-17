export type CertificateStatus =
  | "pending"
  | "generated"
  | "minted"
  | "unavailable";

export interface StudentCertificate {
  certificate_id: number;
  student_id: string;
  student_name: string;
  degree_name: string;
  issue_date: string;
  status: CertificateStatus;
  token_id?: string;
  transaction_hash?: string;
  certificate_hash?: string;
  certificate_file_name?: string;
}
