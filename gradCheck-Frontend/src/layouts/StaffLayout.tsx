import { Outlet } from "react-router-dom";
import StaffNavigation from "../components/StaffNavigation";

const StaffLayout = () => (
  <>
    <StaffNavigation />
    <main>
      <Outlet />
    </main>
  </>
);

export default StaffLayout;
