export const API_BASE_URL = "http://localhost:8000";

const studentPath = (studentId: string) =>
  `/students/${encodeURIComponent(studentId)}`;

export const API_ENDPOINTS = {
  auth: {
    login: "/login",
  },
  degrees: {
    list: "/degrees",
  },
  students: {
    register: "/register",
    profile: (studentId: string) => studentPath(studentId),
    certificates: (studentId: string) =>
      `${studentPath(studentId)}/certificate`,
    certificateDownload: (studentId: string) =>
      `${studentPath(studentId)}/certificate/download`,
    verificationLinks: (studentId: string) =>
      `${studentPath(studentId)}/verification-links`,
    verificationLink: (studentId: string, linkId: number) =>
      `${studentPath(studentId)}/verification-links/${linkId}`,
  },
} as const;
