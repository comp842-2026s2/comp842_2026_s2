import { Navigate, Route, Routes } from "react-router-dom";

import StaffHome from "../pages/StaffHome";
import StaffRegistration from "../components/StaffRegistration";
import CertificateGeneration from "../components/CertificateGeneration";
import AdminDashboard from "../components/AdminDashboard";
import StaffProtectedRoute from "../components/StaffProtectedRoute";
import SuperAdminProtectedRoute from "../components/SuperAdminProtectedRoute";
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

                    {/* Only the fixed "admin" account can reach this —
                        see SuperAdminProtectedRoute + require_super_admin
                        in main.py for the matching backend check. */}
                    <Route element={<SuperAdminProtectedRoute />}>
                        <Route
                            path="register"
                            element={<StaffRegistration />}
                        />
                    </Route>

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
