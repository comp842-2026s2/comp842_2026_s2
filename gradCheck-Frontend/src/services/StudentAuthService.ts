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

  // There's no separate role/tier column yet — the team's fixed rule is
  // simply "only the account whose login_id is literally 'admin' can
  // register new staff", checked the same way on the backend
  // (require_super_admin in main.py). A regular staff account is
  // isStaff() === true but isSuperAdmin() === false.
  isSuperAdmin(): boolean {
    const auth = authStorage.get();
    return auth?.login_type === 2 && auth?.login_id === "admin";
  }
}

export const studentAuthService = new StudentAuthService();

// Alias so Staff-side files don't have to import something named
// "studentAuthService" for what is now a shared service.
export const authService = studentAuthService;
