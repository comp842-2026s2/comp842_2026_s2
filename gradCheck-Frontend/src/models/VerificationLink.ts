export type VerificationLinkDurationDays = 1 | 5 | 10 | 20 | 30;

export interface CreateVerificationLinkRequest {
  certificate_id: number;
  duration_days: VerificationLinkDurationDays;
}

export interface VerificationLink {
  id: number;
  certificate_id: number;
  token: string;
  verification_url: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}
