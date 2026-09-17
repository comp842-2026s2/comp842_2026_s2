import { Navigate, Route, Routes } from "react-router-dom";

import StaffHome from "../pages/StaffHome";
import StaffRegistration from "../components/StaffRegistration";
import CertificateGeneration from "../components/CertificateGeneration";
import AdminDashboard from "../components/AdminDashboard";

const StaffRoutes = () => {
    return (
        <Routes>
            <Route
                index
                element={<Navigate to="login" replace />}
            />

            <Route
                path="login"
                element={<StaffHome />}
            />

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
        </Routes>
    );
};

export default StaffRoutes;