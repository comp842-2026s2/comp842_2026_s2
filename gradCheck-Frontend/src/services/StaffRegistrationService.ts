import type {
  StaffRegistrationRequest,
  StaffRegistrationResponse,
  StudentCredential,
} from "../models/Staff";

class StaffService {
  private readonly baseUrl = "http://localhost:8000";

  async registerStaff(
    request: StaffRegistrationRequest
  ): Promise<StaffRegistrationResponse> {
    const response = await fetch(`${this.baseUrl}/staff/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Staff registration failed");
    }

    return data;
  }

  async getRegistrations(): Promise<StudentCredential[]> {
    const response = await fetch(
      `${this.baseUrl}/admin/registrations`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Unable to retrieve registrations");
    }

    return response.json();
  }

  async generateCertificates() {
    const response = await fetch(
      `${this.baseUrl}/admin/generate-pdf`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Certificate generation failed"
      );
    }

    return data;
  }

  async mintTokens() {
    const response = await fetch(
      `${this.baseUrl}/admin/mint`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Minting failed");
    }

    return data;
  }
}

export const staffService = new StaffService();