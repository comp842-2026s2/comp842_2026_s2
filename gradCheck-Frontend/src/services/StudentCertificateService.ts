import { API_ENDPOINTS } from "../config/ApiConfig";
import type { StudentCertificate } from "../models/Certificate";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

const getDownloadFilename = (
  response: Response,
  fallback: string
): string => {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^";]+)"?/i);

  return match?.[1] ?? fallback;
};

class StudentCertificateService {
  getCertificates(): Promise<StudentCertificate[]> {
    const studentId = authStorage.getLoginId();

    if (!studentId) {
      return Promise.reject(
        new Error("Student ID is missing from the login session.")
      );
    }

    return httpClient.request<StudentCertificate[]>(
      API_ENDPOINTS.students.certificates(studentId)
    );
  }

  async downloadCertificate(registrationId: number): Promise<void> {
    const studentId = authStorage.getLoginId();

    if (!studentId) {
      throw new Error("Student ID is missing from the login session.");
    }

    const path = `${API_ENDPOINTS.students.certificateDownload(
      studentId
    )}?registration_id=${encodeURIComponent(registrationId)}`;

    const { blob, response } = await httpClient.requestBlob(path);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = getDownloadFilename(
      response,
      `${studentId}_certificate.pdf`
    );
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async getContractAddress(): Promise<string> {
    return httpClient.request<string>(
      "/contract-address",
      {},
      false
    );
  }
}

export const studentCertificateService = new StudentCertificateService();
