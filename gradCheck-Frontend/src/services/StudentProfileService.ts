import { API_ENDPOINTS } from "../config/ApiConfig";
import type { StudentCertificate } from "../models/Certificate";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

class StudentProfileService {
  getCurrentStudentRegistrations(): Promise<StudentCertificate[]> {
    const studentId = authStorage.getLoginId();

    if (!studentId) {
      return Promise.reject(
        new Error("Student ID is missing from the login session.")
      );
    }

    return httpClient.request<StudentCertificate[]>(
      API_ENDPOINTS.students.profile(studentId)
    );
  }
}

export const studentProfileService = new StudentProfileService();
