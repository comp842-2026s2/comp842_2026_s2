import { Navigate, Route, Routes } from "react-router-dom";

import StaffHome from "../pages/StaffHome";
import StaffRegistration from "../components/StaffRegistration";
import CertificateGeneration from "../components/CertificateGeneration";
import AdminDashboard from "../components/AdminDashboard";
import StaffProtectedRoute from "../components/StaffProtectedRoute";
import StaffLayout from "../layouts/StaffLayout";

// Login is shared with the Student side (one top-level /login, branching on
// login_type) — these just redirect there instead of duplicating a form, for
// anyone who lands on /staff or /staff/login directly.
const StaffRoutes = () => {
    return (
        <Routes>
            <Route
                index
                element={<Navigate to="/login" replace />}
            />

            <Route
                path="login"
                element={<Navigate to="/login" replace />}
            />

            <Route element={<StaffProtectedRoute />}>
                <Route element={<StaffLayout />}>
                    <Route path="home" element={<StaffHome />} />

                    <Route
                        path="register"
                        element={<StaffRegistration />}
                    />

                    <Route
                        path="certificates"
                        element={<CertificateGeneration />}
                    />

                    <Route
                        path="dashboard"
                        element={<AdminDashboard />}
                    />
                </Route>
            </Route>
        </Routes>
    );
};

export default StaffRoutes;
