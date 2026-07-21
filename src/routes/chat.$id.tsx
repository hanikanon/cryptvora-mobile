import { createFileRoute, redirect } from "@tanstack/react-router";

// This used to be a fully separate mounted route/page for the conversation
// screen. It's now folded into "/" as an internal overlay (no route change,
// no remount) so the chat list <-> conversation transition is genuinely
// seamless — the list never unmounts. This route still exists so external
// links (e.g. search results) that point at /chat/:id keep working: it just
// redirects straight into "/" with the id preserved as a search param, which
// the merged page reads on load to auto-open that conversation.
export const Route = createFileRoute("/chat/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/", search: { open: params.id } });
  },
});
