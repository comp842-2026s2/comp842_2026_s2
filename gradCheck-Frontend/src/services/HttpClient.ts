import { API_BASE_URL } from "../config/ApiConfig";
import { authStorage } from "../utils/AuthStorage";

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as {
      detail?: string;
      message?: string;
    };

    return (
      data.detail ||
      data.message ||
      `Request failed (${response.status})`
    );
  } catch {
    return `Request failed (${response.status})`;
  }
};

export class HttpClient {
  private buildHeaders(
    options: RequestInit,
    includeAuth: boolean
  ): Headers {
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    if (includeAuth) {
      const token = authStorage.getAccessToken();

      if (!token) {
        throw new Error("Your login session is missing. Please log in again.");
      }

      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  }

  async request<T>(
    path: string,
    options: RequestInit = {},
    includeAuth = true
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: this.buildHeaders(options, includeAuth),
    });

    if (!response.ok) {
      if (includeAuth && response.status === 401) {
        authStorage.clear();
      }

      throw new Error(await parseErrorMessage(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async requestBlob(
    path: string,
    options: RequestInit = {},
    includeAuth = true
  ): Promise<{ blob: Blob; response: Response }> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: this.buildHeaders(options, includeAuth),
    });

    if (!response.ok) {
      if (includeAuth && response.status === 401) {
        authStorage.clear();
      }

      throw new Error(await parseErrorMessage(response));
    }

    return {
      blob: await response.blob(),
      response,
    };
  }
}

export const httpClient = new HttpClient();
