import { API_BASE_URL } from "../config/ApiConfig";
import { authStorage } from "../utils/AuthStorage";

export class HttpClient {
  async request<T>(
    path: string,
    options: RequestInit = {},
    includeAuth = true
  ): Promise<T> {
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    if (includeAuth) {
      const token = authStorage.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    let data: unknown = null;

    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorData = data as { detail?: string; message?: string } | null;
      throw new Error(
        errorData?.detail || errorData?.message || `Request failed (${response.status})`
      );
    }

    return data as T;
  }
}

export const httpClient = new HttpClient();
