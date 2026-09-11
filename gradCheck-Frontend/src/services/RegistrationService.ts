import type {
  RegistrationRequest,
  RegistrationResponse,
} from "../models/Registration";

class RegistrationService {
  private readonly baseUrl = "http://localhost:8000";

  async registerStudent(
    request: RegistrationRequest
  ): Promise<RegistrationResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Registration failed");
    }

    return data as RegistrationResponse;
  }
}

export const registrationService = new RegistrationService();