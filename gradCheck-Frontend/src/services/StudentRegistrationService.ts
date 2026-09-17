import { API_ENDPOINTS } from "../config/ApiConfig";
import type {
  StudentRegistrationRequest,
  StudentRegistrationResponse,
} from "../models/Student";
import { httpClient } from "./HttpClient";

interface LoginRegistrationRequest {
  login_id: string;
  login_password: string;
  login_type: number;
}

class StudentRegistrationService {
  async registerStudent(
    student: StudentRegistrationRequest,
    password: string
  ): Promise<StudentRegistrationResponse> {
    const result = await httpClient.request<StudentRegistrationResponse>(
      API_ENDPOINTS.students.register,
      {
        method: "POST",
        body: JSON.stringify(student),
      },
      false
    );

    const loginRequest: LoginRegistrationRequest = {
      login_id: student.student_id,
      login_password: password,
      login_type: 1,
    };

    // Assumption: the backend currently uses POST /login to create login_info.
    // Change this in ApiConfig once a dedicated login-registration route exists.
    await httpClient.request<void>(
      API_ENDPOINTS.auth.login,
      {
        method: "POST",
        body: JSON.stringify(loginRequest),
      },
      false
    );

    return result;
  }
}

export const studentRegistrationService = new StudentRegistrationService();
