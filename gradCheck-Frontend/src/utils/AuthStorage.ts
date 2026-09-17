import type { StudentLoginResponse } from "../models/Auth";

const AUTH_STORAGE_KEY = "studentAuth";

export const authStorage = {
  save(auth: StudentLoginResponse) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  },

  get(): StudentLoginResponse | null {
    const value = sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as StudentLoginResponse;
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  },

  clear() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },

  getAccessToken(): string | null {
    return this.get()?.access_token ?? null;
  },
};
