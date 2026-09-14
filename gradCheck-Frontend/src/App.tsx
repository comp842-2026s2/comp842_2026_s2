import { Routes, Route } from "react-router";

import Home from "./pages/Home";
import RegisterStudent from "./components/RegisterStudent";
import StaffRegistration from "./components/StaffRegistration";
import CertificateGeneration from "./components/CertificateGeneration";
import AdminDashboard from "./components/AdminDashboard";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/student/register"
        element={<RegisterStudent />}
      />

      <Route
          path="/staff/register"
          element={<StaffRegistration />}
        />

        <Route
          path="/staff/certificates"
          element={<CertificateGeneration />}
        />

        <Route
          path="/staff/dashboard"
          element={<AdminDashboard />}
        />
    </Routes>
  );
}

export default App;