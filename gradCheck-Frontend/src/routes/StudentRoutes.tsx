import { Navigate, Route, Routes } from "react-router-dom";
//import StudentProtectedRoute from "../components/StudentProtectedRoute";
//import StudentLayout from "../layouts/StudentLayout";
import StudentCertificatePage from "../pages/StudentCertificatePage";
import StudentDashboardPage from "../pages/StudentDashboardPage";
import StudentLoginPage from "../pages/StudentLoginPage";
import StudentRegistrationPage from "../pages/StudentRegistrationPage";
import StudentVerificationLinksPage from "../pages/StudentVerificationLinksPage";

// const StudentRoutes = () => (
//   <Routes>
//     <Route path="/student/login" element={<StudentLoginPage />} />
//     <Route path="/student/register" element={<StudentRegistrationPage />} />

//     <Route element={<StudentProtectedRoute />}>
//       <Route element={<StudentLayout />}>
//         <Route path="/student/dashboard" element={<StudentDashboardPage />} />
//         <Route path="/student/certificate" element={<StudentCertificatePage />} />
//         <Route
//           path="/student/verification-links"
//           element={<StudentVerificationLinksPage />}
//         />
//       </Route>
//     </Route>

//     <Route path="/student" element={<Navigate to="/student/login" replace />} />
//   </Routes>
// );

const StudentRoutes = () => {
  return (
    <Routes>
      <Route
        path="login"
        element={<StudentLoginPage />}
      />

      <Route
        path="register"
        element={<StudentRegistrationPage />}
      />

      <Route
        path="dashboard"
        element={<StudentDashboardPage />}
      />

      <Route
        path="certificate"
        element={<StudentCertificatePage />}
      />

      <Route
        path="verification-links"
        element={<StudentVerificationLinksPage />}
      />
    </Routes>
  );
};

export default StudentRoutes;
