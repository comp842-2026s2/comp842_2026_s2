import { Outlet } from "react-router-dom";
import StudentNavigation from "../components/StudentNavigation";
import "../styles/StudentTheme.css";

const StudentLayout = () => (
  <>
    <StudentNavigation />
    <main className="student-page-background">
      <Outlet />
    </main>
  </>
);

export default StudentLayout;
