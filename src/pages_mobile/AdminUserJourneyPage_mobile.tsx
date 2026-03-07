import MobileScaffold from "./MobileScaffold";
import AdminUserJourneyPage from "../pages/AdminUserJourneyPage";

export default function AdminUserJourneyPage_mobile() {
  return (
    <MobileScaffold title="User journey" subtitle="Detailed timeline and flags">
      <AdminUserJourneyPage />
    </MobileScaffold>
  );
}
