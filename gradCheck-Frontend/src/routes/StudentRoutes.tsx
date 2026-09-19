import { Navigate, Route, Routes } from "react-router-dom";
import StudentProtectedRoute from "../components/StudentProtectedRoute";
import StudentLayout from "../layouts/StudentLayout";
import StudentCertificatePage from "../pages/StudentCertificatePage";
import StudentDashboardPage from "../pages/StudentDashboardPage";
import StudentRegistrationPage from "../pages/StudentRegistrationPage";
import StudentVerificationLinksPage from "../pages/StudentVerificationLinksPage";

// Login moved out to a top-level /login route (shared with staff — see
// App.tsx and pages/LoginPage.tsx) since it's generic now, not
// student-specific. Only registration stays here.
//
// Dashboard/certificate/verification-links are nested under
// StudentProtectedRoute (redirects to login if not logged in) and
// StudentLayout (adds the navbar with the Logout button) — this was
// temporarily flattened out for early testing (see git history) and never
// switched back, which is why there was no logout button and unauthenticated
// visits to /student/dashboard weren't redirected to login.
const StudentRoutes = () => (
  <Routes>
    <Route path="register" element={<StudentRegistrationPage />} />

    {/* Old bookmarked URL — keep redirecting to the real one. */}
    <Route path="login" element={<Navigate to="/login" replace />} />

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

    <Route path="" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default StudentRoutes;
