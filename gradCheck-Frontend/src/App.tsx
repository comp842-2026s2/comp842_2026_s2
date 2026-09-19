import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StaffRoutes from "./routes/StaffRoutes";
import StudentRoutes from "./routes/StudentRoutes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/*" element={<StudentRoutes />} />
      <Route path="/staff/*" element={<StaffRoutes />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
