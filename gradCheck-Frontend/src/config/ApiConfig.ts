export const API_BASE_URL = "http://localhost:8000";

// Temporary endpoint assumptions until the FastAPI routes are finalized.
export const API_ENDPOINTS = {
  auth: {
    login: "/login",
  },
  students: {
    register: "/register",
    profile: "/students/me",
    certificate: "/students/me/certificate",
    certificateDownload: "/students/me/certificate/download",
    verificationLinks: "/students/me/verification-links",
  },
  degrees: {
    list: "/degrees",
  },
} as const;
