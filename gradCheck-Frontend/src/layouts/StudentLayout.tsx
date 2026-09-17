import { Outlet } from "react-router-dom";
import StudentNavigation from "../components/StudentNavigation";

const StudentLayout = () => (
  <>
    <StudentNavigation />
    <main>
      <Outlet />
    </main>
  </>
);

export default StudentLayout;
