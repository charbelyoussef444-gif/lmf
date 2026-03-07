import MobileScaffold from "./MobileScaffold";
import AdminPage from "../pages/Admin";

export default function AdminPage_mobile() {
  return (
    <MobileScaffold title="Admin" subtitle="Manage users and system health">
      <AdminPage />
    </MobileScaffold>
  );
}
