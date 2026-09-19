import { Navigate, Route, Routes } from "react-router-dom";
import StudentProtectedRoute from "../components/StudentProtectedRoute";
import StudentLayout from "../layouts/StudentLayout";
import StudentCertificatePage from "../pages/StudentCertificatePage";
import StudentDashboardPage from "../pages/StudentDashboardPage";
import StudentLoginPage from "../pages/StudentLoginPage";
import StudentRegistrationPage from "../pages/StudentRegistrationPage";
import StudentVerificationLinksPage from "../pages/StudentVerificationLinksPage";

// Dashboard/certificate/verification-links are nested under
// StudentProtectedRoute (redirects to login if not logged in) and
// StudentLayout (adds the navbar with the Logout button) — this was
// temporarily flattened out for early testing (see git history) and never
// switched back, which is why there was no logout button and unauthenticated
// visits to /student/dashboard weren't redirected to login.
const StudentRoutes = () => (
  <Routes>
    <Route path="login" element={<StudentLoginPage />} />
    <Route path="register" element={<StudentRegistrationPage />} />

    <Route element={<StudentProtectedRoute />}>
      <Route element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="certificate" element={<StudentCertificatePage />} />
        <Route
          path="verification-links"
          element={<StudentVerificationLinksPage />}
        />
      </Route>
    </Route>

    <Route path="" element={<Navigate to="login" replace />} />
  </Routes>
);

export default StudentRoutes;
