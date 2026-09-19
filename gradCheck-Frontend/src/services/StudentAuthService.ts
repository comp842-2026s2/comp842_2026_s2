import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  StudentLoginRequest,
  StudentLoginResponse,
} from "../models/Auth";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

const STUDENT_LOGIN_TYPE = 1;

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

    if (result.login_type !== STUDENT_LOGIN_TYPE) {
      authStorage.clear();
      throw new Error("This account is not registered as a student account.");
    }

    authStorage.save(result);
    return result;
  }

  logout(): void {
    authStorage.clear();
  }

  isLoggedIn(): boolean {
    const auth = authStorage.get();

    return Boolean(
      auth?.access_token &&
        auth.login_id &&
        auth.login_type === STUDENT_LOGIN_TYPE
    );
  }

  getStudentId(): string | null {
    return authStorage.getLoginId();
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
