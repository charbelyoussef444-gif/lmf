import MobileScaffold from "./MobileScaffold";
import ConversationsPage from "../pages/ConversationsPage";

export default function ConversationsPage_mobile() {
  return (
    <MobileScaffold title="Conversations" subtitle="High-intent chats, ranked by compatibility">
      <ConversationsPage />
    </MobileScaffold>
  );
}
