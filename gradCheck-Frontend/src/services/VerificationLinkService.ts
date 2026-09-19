import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  CreateVerificationLinkRequest,
  VerificationLink,
} from "../models/VerificationLink";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

function currentStudentId(): string {
  const studentId = authStorage.getCurrentStudentId();
  if (!studentId) {
    throw new Error("Not logged in.");
  }
  return studentId;
}

class VerificationLinkService {
  getLinks(): Promise<VerificationLink[]> {
    return httpClient.request<VerificationLink[]>(
      API_ENDPOINTS.students.verificationLinks(currentStudentId())
    );
  }

  createLink(
    request: CreateVerificationLinkRequest
  ): Promise<VerificationLink> {
    return httpClient.request<VerificationLink>(
      API_ENDPOINTS.students.verificationLinks(currentStudentId()),
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  revokeLink(linkId: number): Promise<void> {
    return httpClient.request<void>(
      `${API_ENDPOINTS.students.verificationLinks(currentStudentId())}/${linkId}`,
      { method: "DELETE" }
    );
  }
}

export const verificationLinkService = new VerificationLinkService();
