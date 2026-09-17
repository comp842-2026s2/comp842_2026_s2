import { Navigate, Route, Routes } from "react-router-dom";

import StudentRoutes from "./routes/StudentRoutes";
import StaffRoutes from "./routes/StaffRoutes";


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/student/login" replace />}
      />

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