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
  // 2026-09-19: rewritten to call the real backend routes (/staff,
  // /students, /generate-pdf — not the imagined /admin/* + cookie-session
  // API this used to call) via httpClient, which attaches the logged-in
  // admin/staff's Bearer token automatically.

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

  generateCertificates() {
    return httpClient.request<{
      processed: number;
      results: Array<{ registration_id: number; student_id: string; pdf_hash: string; ipfs_cid: string }>;
    }>("/generate-pdf", { method: "POST" });
  }

  generateToken(certificateId: string) {
    // 2026-09-19: backend now has POST /generate-token/{certificate_id} —
    // it's still a stub server-side (no real smart-contract call yet,
    // that's Han Zaw's piece), but it does write a token_id/mint_tx_hash/
    // minted_at back to the DB and flip status to "minted", so the full
    // request/response contract is real and safe to build against now.
    return httpClient.request<StudentCredential>(
      `/generate-token/${encodeURIComponent(certificateId)}`,
      { method: "POST" }
    );
  }
}

export const staffService = new StaffService();
