import { API_ENDPOINTS } from "../config/ApiConfig";
import type { StudentProfile } from "../models/Student";
import { authStorage } from "../utils/AuthStorage";
import { httpClient } from "./HttpClient";

class StudentProfileService {
  async getCurrentStudent(): Promise<StudentProfile> {
    const studentId = authStorage.getCurrentStudentId();
    if (!studentId) {
      throw new Error("Not logged in.");
    }

    // The backend returns a list — a student can hold more than one degree
    // (one registration per degree). Taking the first entry here so this
    // keeps working for the common single-degree case without changing
    // every page that consumes a single StudentProfile; showing all of a
    // student's degrees is a bigger UI decision left for later.
    const rows = await httpClient.request<StudentProfile[]>(
      API_ENDPOINTS.students.profile(studentId)
    );
    if (rows.length === 0) {
      throw new Error("Student not found.");
    }
    return rows[0];
  }
}

export const studentProfileService = new StudentProfileService();
