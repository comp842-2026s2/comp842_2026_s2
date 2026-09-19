export const API_BASE_URL = "http://localhost:8000";

// Routes are finalized now (see gradCheck-Backend/API_GUIDE.md) — the
// student-scoped ones take the real studentId (the backend's route is
// /students/{studentid}/..., there's no "me" alias), not a literal "me".
export const API_ENDPOINTS = {
  auth: {
    login: "/login",
  },
  students: {
    register: "/register",
    profile: (studentId: string) => `/students/${studentId}`,
    certificate: (studentId: string) => `/students/${studentId}/certificate`,
    certificateDownload: (studentId: string) =>
      `/students/${studentId}/certificate/download`,
    verificationLinks: (studentId: string) =>
      `/students/${studentId}/verification-links`,
  },
  degrees: {
    list: "/degrees",
  },
} as const;
