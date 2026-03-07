import MobileScaffold from "./MobileScaffold";
import AuthCallback from "../pages/AuthCallback";

export default function AuthCallback_mobile() {
  return (
    <MobileScaffold title="Authentication" subtitle="Completing secure sign in">
      <AuthCallback />
    </MobileScaffold>
  );
}
