import { Routes, Route } from "react-router";

import Home from "./pages/Home";
import RegisterStudent from "./components/RegisterStudent";

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
    </Routes>
  );
}

export default App;