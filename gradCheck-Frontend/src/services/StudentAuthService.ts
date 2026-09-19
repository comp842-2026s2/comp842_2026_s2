import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  StudentLoginRequest,
  StudentLoginResponse,
} from "../models/Auth";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

// Shared by both the Student and Staff sides — there's one login page and
// one /login call for everyone; login_type in the response (1 = student,
// 2 = admin/staff) is what the app branches on afterwards, not a separate
// login flow per role.
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

    authStorage.save(result);
    return result;
  }

  logout(): void {
    authStorage.clear();
  }

  isLoggedIn(): boolean {
    return authStorage.get() !== null;
  }

  isStudent(): boolean {
    return authStorage.get()?.login_type === 1;
  }

  isStaff(): boolean {
    return authStorage.get()?.login_type === 2;
  }
}

export const studentAuthService = new StudentAuthService();

// Alias so Staff-side files don't have to import something named
// "studentAuthService" for what is now a shared service.
export const authService = studentAuthService;
