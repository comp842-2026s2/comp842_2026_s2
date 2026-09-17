import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  CreateVerificationLinkRequest,
  VerificationLink,
} from "../models/VerificationLink";
import { httpClient } from "./HttpClient";

class VerificationLinkService {
  getLinks(): Promise<VerificationLink[]> {
    return httpClient.request<VerificationLink[]>(
      API_ENDPOINTS.students.verificationLinks
    );
  }

  createLink(
    request: CreateVerificationLinkRequest
  ): Promise<VerificationLink> {
    return httpClient.request<VerificationLink>(
      API_ENDPOINTS.students.verificationLinks,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  revokeLink(linkId: number): Promise<void> {
    return httpClient.request<void>(
      `${API_ENDPOINTS.students.verificationLinks}/${linkId}`,
      { method: "DELETE" }
    );
  }
}

export const verificationLinkService = new VerificationLinkService();
