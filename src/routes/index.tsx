import { createFileRoute, Link } from "@tanstack/react-router";
import { ChatList } from "@/components/chat-list";
import { OwlMark } from "@/components/logo";
import { Sparkles, MessageSquareText, Search, Bell } from "lucide-react";

export const Route = createFileRoute("/")({
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
  return (
    <div className="lg:grid lg:h-screen lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* Chat list column */}
      <section className="border-r border-border lg:h-screen lg:overflow-hidden">
        {/* Mobile header — desktop gets the "Chats" header below instead */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2.5">
            <OwlMark size={38} />
            <div>
              <h1 className="text-[17px] font-bold leading-tight tracking-tight">Cryptvora</h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Premium Alpha
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/search"
              className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/5 active:bg-white/10"
              aria-label="Search"
            >
              <Search className="size-[19px]" />
            </Link>
            <Link
              to="/notifications"
              className="relative grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/5 active:bg-white/10"
              aria-label="Notifications"
            >
              <Bell className="size-[19px]" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
            </Link>
          </div>
        </div>

        <div className="hidden items-center justify-between border-b border-border px-5 py-4 lg:flex">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Chats</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              14 unread · 3 mentions
            </p>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:bg-primary/90">
            <MessageSquareText className="size-[16px]" />
          </button>
        </div>
        <div className="lg:h-[calc(100vh-73px)] lg:overflow-y-auto">
          <ChatList />
        </div>
      </section>

      {/* Empty state (desktop only) */}
      <section className="relative hidden lg:flex lg:items-center lg:justify-center overflow-hidden">
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
      </section>
    </div>
  );
}
