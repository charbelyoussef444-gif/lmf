import MobileScaffold from "./MobileScaffold";
import MobileOnlyPage from "../pages/MobileOnlyPage";

export default function MobileOnlyPage_mobile() {
  return (
    <MobileScaffold title="Install app" subtitle="Native app gives the best experience">
      <MobileOnlyPage />
    </MobileScaffold>
  );
}
