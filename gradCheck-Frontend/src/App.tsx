import { Navigate, Route, Routes } from "react-router-dom";

import StudentRoutes from "./routes/StudentRoutes";
import StaffRoutes from "./routes/StaffRoutes";
import LoginPage from "./pages/LoginPage";


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Shared by students and staff — one page, branches by login_type
          after signing in (see pages/LoginPage.tsx). */}
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/student/*"
        element={<StudentRoutes />}
      />

      <Route
        path="/staff/*"
        element={<StaffRoutes />}
      />
    </Routes>
  );
}


export default App;
