export type VerificationLinkDurationDays = 1 | 5 | 10 | 20 | 30;

export interface CreateVerificationLinkRequest {
  registration_id: number;
  expires_in_days: VerificationLinkDurationDays;
}

/** Metadata returned by GET /students/{studentid}/verification-links. */
export interface VerificationLinkSummary {
  id: number;
  registration_id: number;
  created_at: string;
  expires_at: string;
  revoked: boolean;
}

/**
 * The raw token is intentionally returned only once when the link is created.
 * The backend stores only its SHA-256 hash.
 */
export interface CreatedVerificationLink {
  id: number;
  token: string;
  expires_at: string;
}

export interface RevokeVerificationLinkResponse {
  id: number;
  revoked: boolean;
}
