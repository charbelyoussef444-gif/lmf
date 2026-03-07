import MobileScaffold from "./MobileScaffold";
import ChatbotPage from "../pages/ChatbotPage";

export default function ChatbotPage_mobile() {
  return (
    <MobileScaffold title="Assessment" subtitle="Answer clearly to improve match quality">
      <ChatbotPage />
    </MobileScaffold>
  );
}
