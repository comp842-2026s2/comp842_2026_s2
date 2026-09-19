import { API_ENDPOINTS } from "../config/ApiConfig";
import {
  LOGIN_TYPE_STAFF,
  LOGIN_TYPE_STUDENT,
  type LoginRequest,
  type LoginResponse,
  type LoginType,
} from "../models/Auth";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

class AuthService {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const result = await httpClient.request<LoginResponse>(
      API_ENDPOINTS.auth.login,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      false
    );

    if (
      result.login_type !== LOGIN_TYPE_STUDENT &&
      result.login_type !== LOGIN_TYPE_STAFF
    ) {
      throw new Error("Unsupported account type returned by the server.");
    }

    authStorage.save(result);
    return result;
  }

  logout(): void {
    authStorage.clear();
  }

  isLoggedIn(): boolean {
    return Boolean(authStorage.getAccessToken());
  }

  isStudent(): boolean {
    return authStorage.get()?.login_type === 1;
  }

  isStaff(): boolean {
    return authStorage.get()?.login_type === 2;
  }

  isSuperAdmin(): boolean {
    const auth = authStorage.get();
    return auth?.login_type === 2 && auth?.login_id === "admin";
  }

  hasLoginType(loginType: LoginType): boolean {
    return authStorage.getLoginType() === loginType;
  }

  getDefaultRoute(loginType: LoginType | null = authStorage.getLoginType()): string {
    if (loginType === LOGIN_TYPE_STUDENT) {
      return "/student/dashboard";
    }

    if (loginType === LOGIN_TYPE_STAFF) {
      return "/staff/dashboard";
    }

    return "/login";
  }
}

export const authService = new AuthService();
