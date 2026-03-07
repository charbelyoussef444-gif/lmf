import MobileScaffold from "./MobileScaffold";
import LoginPage from "../pages/LoginPage";

export default function LoginPage_mobile() {
  return (
    <MobileScaffold title="Welcome" subtitle="Sign in or create your account">
      <LoginPage />
    </MobileScaffold>
  );
}
