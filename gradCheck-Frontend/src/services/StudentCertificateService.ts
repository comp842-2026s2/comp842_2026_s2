import { API_BASE_URL, API_ENDPOINTS } from "../config/ApiConfig";
import type { StudentCertificate } from "../models/Certificate";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

class StudentCertificateService {
  async getCertificate(): Promise<StudentCertificate> {
    const studentId = authStorage.getCurrentStudentId();
    if (!studentId) {
      throw new Error("Not logged in.");
    }

    // Same "list, take the first" adapter as StudentProfileService — a
    // student can have more than one certificate (one per degree).
    const rows = await httpClient.request<StudentCertificate[]>(
      API_ENDPOINTS.students.certificate(studentId)
    );
    if (rows.length === 0) {
      throw new Error("No certificate found.");
    }
    return rows[0];
  }

  async downloadCertificate(): Promise<void> {
    const studentId = authStorage.getCurrentStudentId();
    if (!studentId) {
      throw new Error("Not logged in.");
    }

    const token = authStorage.getAccessToken();
    const headers = new Headers();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.students.certificateDownload(studentId)}`,
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
