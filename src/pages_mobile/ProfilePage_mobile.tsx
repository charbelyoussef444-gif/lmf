import MobileScaffold from "./MobileScaffold";
import ProfilePage from "../pages/ProfilePage";

export default function ProfilePage_mobile() {
  return (
    <MobileScaffold title="Profile" subtitle="Privacy-first profile controls">
      <ProfilePage />
    </MobileScaffold>
  );
}
