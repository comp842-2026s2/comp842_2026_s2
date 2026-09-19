import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  StudentCertificateRegistrationRequest,
  StudentCertificateRegistrationResponse,
} from "../models/Certificate";
import { httpClient } from "./HttpClient";

class StudentCertificateRegistrationService {
  registerCertificate(
    request: StudentCertificateRegistrationRequest
  ): Promise<StudentCertificateRegistrationResponse> {
    // POST /register also supports an existing student registering another
    // degree/certificate. We intentionally omit student_password here so no
    // new login_info row is created.
    return httpClient.request<StudentCertificateRegistrationResponse>(
      API_ENDPOINTS.students.register,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }
}

export const studentCertificateRegistrationService =
  new StudentCertificateRegistrationService();
