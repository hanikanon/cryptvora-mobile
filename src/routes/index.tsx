import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatList } from "@/components/chat-list";
import { ChatThread } from "@/components/chat/ChatThread";
import { InfoPanel } from "@/components/conversation";
import { OwlMark } from "@/components/logo";
import { Sparkles, Search, Bell, BadgeCheck } from "lucide-react";
import { chats, type Chat } from "@/lib/mock-data";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    open: typeof search.open === "string" ? search.open : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chats — Cryptvora" },
      {
        name: "description",
        content:
          "Your private chats, groups and channels on Cryptvora — the premium community for traders.",
      },
    ],
  }),
  component: ChatsIndex,
});

function ChatsIndex() {
  const { open } = Route.useSearch();
  const navigate = useNavigate();
  const [openChat, setOpenChat] = useState<Chat | null>(
    () => chats.find((c) => c.id === open) ?? null,
  );

  // Keep local state in sync if the search param changes from outside this
  // component (e.g. a deep link, or the hardware back button below).
  useEffect(() => {
    setOpenChat(open ? (chats.find((c) => c.id === open) ?? null) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openChatById = (chat: Chat) => {
    setOpenChat(chat);
    navigate({ to: "/", search: { open: chat.id } });
  };
  const closeChat = () => {
    setOpenChat(null);
    navigate({ to: "/", search: {} });
  };

  // Android hardware back button: close an open conversation first (like a
  // native back-stack), instead of leaving the page or exiting the app.
  useEffect(() => {
    let remove: (() => void) | undefined;
    let cancelled = false;
    import("@capacitor/app").then(({ App }) => {
      if (cancelled) return;
      App.addListener("backButton", ({ canGoBack }) => {
        if (openChat) {
          closeChat();
        } else if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      }).then((handle) => {
        remove = () => handle.remove();
      });
    });
    return () => {
      cancelled = true;
      remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChat]);

  return (
    <div className="lg:grid lg:h-screen lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)_320px]">
      {/* Chat list column — always mounted, never unmounts when a chat opens */}
      <section className="light relative border-r border-border bg-background lg:h-screen lg:overflow-hidden">
        {/* Mobile header: search — logo · wordmark · badge — notifications */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <Link
            to="/search"
            className="grid size-11 place-items-center rounded-full text-foreground ring-1 ring-border hover:bg-black/[0.03] active:bg-black/[0.06]"
            aria-label="Search"
          >
            <Search className="size-[19px]" />
          </Link>
          <div className="flex items-center gap-1.5">
            <OwlMark size={30} />
            <span className="text-[19px] font-bold tracking-tight text-foreground">Cryptvora</span>
            <BadgeCheck className="size-[18px] text-primary" />
          </div>
          <Link
            to="/notifications"
            className="relative grid size-11 place-items-center rounded-full text-foreground ring-1 ring-border hover:bg-black/[0.03] active:bg-black/[0.06]"
            aria-label="Notifications"
          >
            <Bell className="size-[19px]" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background" />
          </Link>
        </div>

        <div className="hidden items-center justify-between border-b border-border px-5 py-4 lg:flex">
          <div className="flex items-center gap-2">
            <OwlMark size={28} />
            <h1 className="text-lg font-semibold tracking-tight">Cryptvora</h1>
            <BadgeCheck className="size-4 text-primary" />
          </div>
        </div>

        <div className="lg:h-[calc(100vh-73px)] lg:overflow-y-auto">
          <ChatList activeId={openChat?.id} onSelect={openChatById} />
        </div>
      </section>

      {/* Desktop detail panel — list stays visible beside it, exactly like before */}
      <section className="hidden lg:block lg:h-screen lg:overflow-hidden xl:mr-0">
        {openChat ? (
          <ChatThread chat={openChat} onBack={closeChat} />
        ) : (
          <div className="relative flex h-full items-center justify-center overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(600px 400px at 50% 30%, color-mix(in oklab, var(--primary) 20%, transparent), transparent)",
              }}
            />
            <div className="relative z-10 max-w-md px-6 text-center">
              <div className="mx-auto flex size-24 items-center justify-center">
                <OwlMark size={96} />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                Welcome to <span className="text-gradient">Cryptvora</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Select a conversation to jump in, or start a new one. Signal, not noise.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[12px] text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                1,248 traders online right now
              </div>
            </div>
          </div>
        )}
      </section>
      {openChat && <InfoPanel chat={openChat} />}

      {/* Mobile: conversation as a true overlay sliding over the still-mounted list */}
      <AnimatePresence>
        {openChat && (
          <motion.div
            key={openChat.id}
            className="fixed inset-0 z-20 bg-background lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ willChange: "transform" }}
          >
            <ChatThread chat={openChat} onBack={closeChat} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
