import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import StudentLayout from "../layouts/StudentLayout";
import { LOGIN_TYPE_STUDENT } from "../models/Auth";
import StudentCertificatePage from "../pages/StudentCertificatePage";
import StudentDashboardPage from "../pages/StudentDashboardPage";
import StudentRegistrationPage from "../pages/StudentRegistrationPage";
import StudentVerificationLinksPage from "../pages/StudentVerificationLinksPage";

/**
 * Mount from App.tsx with:
 * <Route path="/student/*" element={<StudentRoutes />} />
 */
const StudentRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="register" element={<StudentRegistrationPage />} />

    <Route element={<ProtectedRoute allowedLoginTypes={[LOGIN_TYPE_STUDENT]} />}>
      <Route element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="certificate" element={<StudentCertificatePage />} />
        <Route
          path="verification-links"
          element={<StudentVerificationLinksPage />}
        />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="dashboard" replace />} />
  </Routes>
);

export default StudentRoutes;
