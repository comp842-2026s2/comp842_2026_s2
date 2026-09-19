import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  StudentRegistrationRequest,
  StudentRegistrationResponse,
} from "../models/Student";
import { httpClient } from "./HttpClient";

class StudentRegistrationService {
  registerStudent(
    request: StudentRegistrationRequest
  ): Promise<StudentRegistrationResponse> {
    // The backend creates both the certificate registration and login_info
    // account in this one call when student_password is supplied.
    return httpClient.request<StudentRegistrationResponse>(
      API_ENDPOINTS.students.register,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      false
    );
  }
}

export const studentRegistrationService = new StudentRegistrationService();
