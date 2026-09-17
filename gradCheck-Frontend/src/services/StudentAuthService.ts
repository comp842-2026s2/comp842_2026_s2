import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  StudentLoginRequest,
  StudentLoginResponse,
} from "../models/Auth";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

class StudentAuthService {
  async login(request: StudentLoginRequest): Promise<StudentLoginResponse> {
    const result = await httpClient.request<StudentLoginResponse>(
      API_ENDPOINTS.auth.login,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      false
    );

    if (result.login_type !== 1) {
      throw new Error("This login is not registered as a student account.");
    }

    authStorage.save(result);
    return result;
  }

  logout(): void {
    authStorage.clear();
  }

  isLoggedIn(): boolean {
    const auth = authStorage.get();
    return auth !== null && auth.login_type === 1;
  }
}

export const studentAuthService = new StudentAuthService();
