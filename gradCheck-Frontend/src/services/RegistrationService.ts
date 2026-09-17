import type {
  RegistrationRequest,
  RegistrationResponse,
} from "../models/Registration";

type LoginRequest = {
  login_id: string;
  login_password: string;
  login_type: number;
};

class RegistrationService {
  private readonly baseUrl = "http://localhost:8000";

  // Change this value if your backend uses a different number for students.
  private readonly studentLoginType = 1;

  async registerStudent(
    request: RegistrationRequest,
    password: string
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

    await this.createLogin({
      login_id: request.student_id,
      login_password: password,
      login_type: this.studentLoginType,
    });

    return data as RegistrationResponse;
  }

  private async createLogin(request: LoginRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let message = "Unable to create student login";

      try {
        const data = await response.json();
        message = data.detail || message;
      } catch {
        // Keep the default message if the API does not return JSON.
      }

      throw new Error(message);
    }
  }
}

export const registrationService = new RegistrationService();
