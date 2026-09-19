import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  CreateVerificationLinkRequest,
  CreatedVerificationLink,
  RevokeVerificationLinkResponse,
  VerificationLinkSummary,
} from "../models/VerificationLink";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

class VerificationLinkService {
  private getStudentId(): string {
    const studentId = authStorage.getLoginId();

    if (!studentId) {
      throw new Error("Student ID is missing from the login session.");
    }

    return studentId;
  }

  getLinks(): Promise<VerificationLinkSummary[]> {
    const studentId = this.getStudentId();

    return httpClient.request<VerificationLinkSummary[]>(
      API_ENDPOINTS.students.verificationLinks(studentId)
    );
  }

  createLink(
    request: CreateVerificationLinkRequest
  ): Promise<CreatedVerificationLink> {
    const studentId = this.getStudentId();

    return httpClient.request<CreatedVerificationLink>(
      API_ENDPOINTS.students.verificationLinks(studentId),
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  revokeLink(linkId: number): Promise<RevokeVerificationLinkResponse> {
    const studentId = this.getStudentId();

    return httpClient.request<RevokeVerificationLinkResponse>(
      API_ENDPOINTS.students.verificationLink(studentId, linkId),
      { method: "DELETE" }
    );
  }
}

export const verificationLinkService = new VerificationLinkService();
