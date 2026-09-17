import { API_BASE_URL, API_ENDPOINTS } from "../config/ApiConfig";
import type { StudentCertificate } from "../models/Certificate";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

class StudentCertificateService {
  getCertificate(): Promise<StudentCertificate> {
    return httpClient.request<StudentCertificate>(
      API_ENDPOINTS.students.certificate
    );
  }

  async downloadCertificate(): Promise<void> {
    const token = authStorage.getAccessToken();
    const headers = new Headers();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.students.certificateDownload}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Unable to download certificate.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "graduation-certificate.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

export const studentCertificateService = new StudentCertificateService();
