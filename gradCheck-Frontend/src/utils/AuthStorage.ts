import type { LoginResponse, LoginType } from "../models/Auth";

const AUTH_STORAGE_KEY = "gradcheckAuth";

export const authStorage = {
  save(auth: LoginResponse): void {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  },

  get(): LoginResponse | null {
    const value = sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as LoginResponse;
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  },

  clear(): void {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },

  getAccessToken(): string | null {
    return this.get()?.access_token ?? null;
  },

  getLoginId(): string | null {
    return this.get()?.login_id ?? null;
  },

  getLoginType(): LoginType | null {
    return this.get()?.login_type ?? null;
  },
};
