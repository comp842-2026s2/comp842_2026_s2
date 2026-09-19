import type {
  StaffRegistrationRequest,
  StaffRegistrationResponse,
  StudentCredential,
} from "../models/Staff";
import { httpClient } from "./HttpClient";

interface StaffRow {
  id: number;
  staff_id: string;
  full_name: string;
  email: string;
}

class StaffService {
  // Calls the real backend routes (/staff, /students, /generate-pdf,
  // /generate-token/{certificate_id}) via httpClient, which attaches the
  // logged-in admin/staff's Bearer token automatically.

  async registerStaff(
    request: StaffRegistrationRequest
  ): Promise<StaffRegistrationResponse> {
    // Creates the staff_registrations row — admin/staff token required
    // (per team decision: staff accounts are created by an existing
    // admin, not self-service).
    const staffRow = await httpClient.request<StaffRow>("/staff", {
      method: "POST",
      body: JSON.stringify({
        staff_id: request.staffId,
        full_name: request.fullName,
        email: request.email,
      }),
    });

    // Also creates their login_info row (login_type 2) so they can
    // actually sign in afterwards — /staff alone doesn't do this.
    await httpClient.request<void>("/login/register", {
      method: "POST",
      body: JSON.stringify({
        login_id: request.staffId,
        login_password: request.password,
        login_type: 2,
      }),
    });

    return {
      message: "Staff account created successfully.",
      staffId: staffRow.staff_id,
    };
  }

  getRegistrations(): Promise<StudentCredential[]> {
    return httpClient.request<StudentCredential[]>("/students");
  }

  // Backend only has a BULK pdf endpoint (POST /generate-pdf, no body,
  // no path param) — it processes every "registered" row in one call.
  // There is no per-certificate PDF endpoint, so there's no per-row
  // generatePdf(certificateId) here — see CertificateGeneration.tsx's
  // "Generate PDF (all pending)" button, which is the only PDF action.
  generateCertificates() {
    return httpClient.request<{
      processed: number;
      results: Array<{ registration_id: number; student_id: string; pdf_hash: string; ipfs_cid: string }>;
    }>("/generate-pdf", { method: "POST" });
  }

  // Backend route is POST /generate-token/{certificate_id} — the
  // certificate id is a PATH param, not a JSON body, and it doesn't take
  // registration_id at all (see main.py: generate_token(certificate_id)).
  // It's still a stub server-side (no real smart-contract call yet,
  // that's Han Zaw's piece), but it does write a token_id/mint_tx_hash/
  // minted_at back to the DB and flip status to "minted", so the full
  // request/response contract is real and safe to build against now.
  generateToken(certificateId: string) {
    return httpClient.request<StudentCredential>(
      `/generate-token/${encodeURIComponent(certificateId)}`,
      { method: "POST" }
    );
  }
}

export const staffService = new StaffService();
