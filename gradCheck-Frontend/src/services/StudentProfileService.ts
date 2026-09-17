import { API_ENDPOINTS } from "../config/ApiConfig";
import type { StudentProfile } from "../models/Student";
import { httpClient } from "./HttpClient";

class StudentProfileService {
  getCurrentStudent(): Promise<StudentProfile> {
    return httpClient.request<StudentProfile>(API_ENDPOINTS.students.profile);
  }
}

export const studentProfileService = new StudentProfileService();
