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

  generatePdf(certificateId: string, registrationId: number) {
    return httpClient.request("/generate-pdf", {
      method: "POST",
      body: JSON.stringify({ certificate_id: certificateId, registration_id: registrationId }),
    });
  }

  generateToken(certificateId: string) {
    return httpClient.request(`/generate-token/${encodeURIComponent(certificateId)}`, {
      method: "POST",
    });
  }

  mintTokens(): Promise<never> {
    // There's no /admin/mint (or any minting endpoint) on the backend yet —
    // that's Han Zaw's smart-contract piece and hasn't landed. Nothing in
    // the UI currently calls this; it throws instead of silently hitting
    // a 404 if something is wired to it before that piece exists.
    return Promise.reject(
      new Error("Blockchain minting isn't available yet.")
    );
  }
}

export const staffService = new StaffService();
