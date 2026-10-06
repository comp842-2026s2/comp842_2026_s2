import type {
  DocumentVerificationResult,
  VerificationLinkValidation,
} from "../models/PublicVerification";

import { httpClient } from "./HttpClient";
import { API_BASE_URL } from "../config/ApiConfig";


class PublicVerificationService {
  async validateLink(
    token: string
  ): Promise<VerificationLinkValidation> {
    return httpClient.request<VerificationLinkValidation>(
      `/verify-link/${encodeURIComponent(token)}`,
      {},
      false
    );
  }

  async verifyDocument(
    certificateFile: File
  ): Promise<DocumentVerificationResult> {
    const formData = new FormData();

    formData.append("file", certificateFile);

    const response = await fetch(
      `${API_BASE_URL}/verify-document`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      let message = `Request failed (${response.status})`;

      try {
        const data = await response.json();

        if (data?.detail) {
          message =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail);
        }
      } catch {
        // Use fallback message.
      }

      throw new Error(message);
    }

    return (await response.json()) as DocumentVerificationResult;
  }
}

export const publicVerificationService =
  new PublicVerificationService();
