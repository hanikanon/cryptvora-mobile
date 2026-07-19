import {
  ArrowLeft,
  Paperclip,
  Mic,
  Send,
  Phone,
  Video,
  MoreHorizontal,
  Smile,
  Play,
  Reply,
  CheckCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/avatar";
import { VerificationBadge } from "@/components/verification-badge";
import { conversation, type Chat, type Message } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CallPanel } from "@/components/call/CallPanel";

function roleTag(role?: Message["authorRole"]) {
  if (!role) return null;
  const map = {
    admin: { label: "Admin", cls: "bg-primary/15 text-primary" },
    mod: { label: "Mod", cls: "bg-white/[0.08] text-foreground/80" },
    pro: { label: "Pro", cls: "bg-primary/10 text-primary-glow" },
  } as const;
  const item = map[role];
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest",
        item.cls,
      )}
    >
      {item.label}
    </span>
  );
}

function ChartBlock() {
  // Faux TradingView-style chart card
  return (
    <div className="mt-1 overflow-hidden rounded-2xl bg-black/60 ring-1 ring-border-strong">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-foreground">ETHUSDT</span>
          <span className="text-muted-foreground">4H</span>
          <span className="text-success">+2.14%</span>
        </div>
        <span className="font-mono text-muted-foreground">2,847.30</span>
      </div>
      <svg viewBox="0 0 320 140" className="block h-32 w-full">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.66 0.22 300)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.66 0.22 300)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 60, 90, 120].map((y) => (
          <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="oklch(1 0 0 / 0.05)" />
        ))}
        <path
          d="M0,90 L20,85 L40,95 L60,75 L80,80 L100,65 L120,70 L140,55 L160,60 L180,40 L200,50 L220,35 L240,45 L260,30 L280,38 L300,25 L320,32"
          fill="none"
          stroke="oklch(0.78 0.18 300)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M0,90 L20,85 L40,95 L60,75 L80,80 L100,65 L120,70 L140,55 L160,60 L180,40 L200,50 L220,35 L240,45 L260,30 L280,38 L300,25 L320,32 L320,140 L0,140 Z"
          fill="url(#area)"
        />
      </svg>
    </div>
  );
}

function VoiceBlock({ duration }: { duration: string }) {
  return (
    <div className="mt-1 flex min-w-[220px] items-center gap-3 rounded-2xl bg-black/40 p-2.5 ring-1 ring-border">
      <button
        type="button"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        <Play className="size-4" fill="currentColor" />
      </button>
      <div className="flex flex-1 items-center gap-0.5">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-primary/70"
            style={{ height: `${6 + Math.abs(Math.sin(i * 0.9)) * 22}px` }}
          />
        ))}
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{duration}</span>
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const own = m.own;
  return (
    <div
      className={cn(
        "flex w-full gap-2.5 animate-bubble-in",
        own ? "justify-end" : "justify-start",
      )}
    >
      {!own && (
        <Avatar seed={m.author} name={m.author} size={32} className="mt-6" />
      )}
      <div className={cn("max-w-[78%] lg:max-w-[62%]", own && "items-end")}>
        {!own && (
          <div className="mb-1 flex items-center gap-2 px-1">
            <span className="text-[12px] font-semibold text-foreground">
              {m.author}
            </span>
            {roleTag(m.authorRole)}
            <span className="text-[10px] text-muted-foreground">{m.time}</span>
          </div>
        )}
        <div
          className={cn(
            "group relative rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[0_2px_20px_-8px_oklch(0_0_0/0.5)] ring-1",
            own
              ? "rounded-br-md bg-primary text-primary-foreground ring-primary/20"
              : "rounded-tl-md bg-surface text-foreground ring-border",
          )}
        >
          {m.reply && (
            <div
              className={cn(
                "mb-2 rounded-lg border-l-2 px-2 py-1 text-[12px]",
                own
                  ? "border-white/60 bg-white/10"
                  : "border-primary bg-primary/10",
              )}
            >
              <p className="font-semibold">{m.reply.author}</p>
              <p className="line-clamp-1 opacity-80">{m.reply.text}</p>
            </div>
          )}
          {m.kind === "chart" && <ChartBlock />}
          {m.kind === "voice" && <VoiceBlock duration={m.meta ?? "0:00"} />}
          {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
          {m.kind === "chart" && m.meta && (
            <p
              className={cn(
                "mt-2 text-[11px]",
                own ? "text-muted-foreground" : "text-muted-foreground",
              )}
            >
              {m.meta}
            </p>
          )}

          {own && (
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
              <span>{m.time}</span>
              <CheckCheck className={cn("size-3.5", m.read && "text-white")} />
            </div>
          )}

          {/* Hover reply button */}
          <button
            type="button"
            className="absolute -top-3 hidden size-7 place-items-center rounded-full bg-surface-2 text-muted-foreground opacity-0 ring-1 ring-border transition-opacity group-hover:opacity-100 lg:grid"
            style={{ [own ? "left" : "right"]: "-2.25rem" } as React.CSSProperties}
          >
            <Reply className="size-3.5" />
          </button>
        </div>

        {m.reactions && m.reactions.length > 0 && (
          <div
            className={cn(
              "mt-1 flex gap-1",
              own ? "justify-end" : "justify-start",
            )}
          >
            {m.reactions.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-surface/80 px-2 py-0.5 text-[11px] ring-1 ring-border"
              >
                <span>{r.emoji}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConversationPanel({ chat }: { chat: Chat }) {
  const [messages, setMessages] = useState<Message[]>(conversation);
  const [draft, setDraft] = useState("");
  const [callPanelOpen, setCallPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset the thread when switching to a different chat, and jump to the
  // latest message whenever the list grows.
  useEffect(() => {
    setMessages(conversation);
  }, [chat.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${now.getTime()}`,
        author: "You",
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        own: true,
        text,
        read: false,
      },
    ]);
    setDraft("");
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background lg:h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-3 pt-[max(env(safe-area-inset-top),0.5rem)] pb-3 backdrop-blur-xl lg:px-6 lg:pt-4">
        <Link
          to="/"
          className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar
          seed={chat.avatarSeed}
          name={chat.name}
          size={40}
          isOwl={chat.avatarSeed === "owl"}
          online={chat.kind === "dm" ? chat.online : undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[15px] font-semibold tracking-tight">
              {chat.name}
            </h2>
            {chat.verified && <VerificationBadge tier={chat.badge ?? "verified"} size={16} />}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {chat.typing
              ? "typing…"
              : chat.kind === "dm"
                ? chat.online
                  ? "Online"
                  : "Last seen recently"
                : `${chat.members?.toLocaleString() ?? 0} members${chat.online ? " · 128 online" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCallPanelOpen(true)}
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
          >
            <Phone className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setCallPanelOpen(true)}
            className="hidden size-9 place-items-center rounded-full text-muted-foreground hover:bg-white/[0.04] hover:text-foreground sm:grid"
          >
            <Video className="size-[18px]" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
          >
            <MoreHorizontal className="size-[18px]" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-3 py-5 lg:px-8"
      >
        <div className="mx-auto w-fit rounded-full bg-surface/60 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border">
          Today
        </div>
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background/80 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur-xl lg:px-6">
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full bg-surface/60 text-muted-foreground ring-1 ring-border hover:text-foreground"
          >
            <Paperclip className="size-[18px]" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-surface/60 px-3.5 py-2.5 ring-1 ring-border focus-within:ring-primary/40">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={`Message ${chat.name}…`}
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
            />
            <button type="button" className="text-muted-foreground hover:text-foreground">
              <Smile className="size-[18px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={sendMessage}
            disabled={!draft.trim()}
            aria-label="Send message"
            className="press grid size-10 place-items-center rounded-full bg-gradient-to-b from-primary to-[color-mix(in_oklab,var(--primary)_82%,black)] text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-opacity disabled:opacity-40"
          >
            <Send className="size-[18px]" />
          </button>
          <button
            type="button"
            className="hidden size-10 place-items-center rounded-full bg-surface/60 text-muted-foreground ring-1 ring-border hover:text-foreground sm:grid"
          >
            <Mic className="size-[18px]" />
          </button>
        </div>
      </div>
      <CallPanel open={callPanelOpen} onClose={() => setCallPanelOpen(false)} />
    </div>
  );
}

export function InfoPanel({ chat }: { chat: Chat }) {
  const media = Array.from({ length: 6 });
  return (
    <aside className="hidden xl:flex fixed inset-y-0 right-0 w-[320px] flex-col border-l border-border bg-sidebar/70 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight">Info</h3>
        <button className="text-xs text-muted-foreground hover:text-foreground">
          Manage
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center text-center">
          <Avatar
            seed={chat.avatarSeed}
            name={chat.name}
            size={96}
            isOwl={chat.avatarSeed === "owl"}
            ring
          />
          <div className="mt-4 flex items-center gap-1.5">
            <h4 className="text-lg font-semibold tracking-tight">{chat.name}</h4>
            {chat.verified && <VerificationBadge tier={chat.badge ?? "verified"} size={16} />}
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {chat.members
              ? `${chat.members.toLocaleString()} members`
              : chat.online
                ? "Online"
                : "Last seen recently"}
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-foreground/70">
            A private members-only circle for high-conviction crypto traders. Alpha,
            structure, and calm signal.
          </p>
          <div className="mt-5 flex w-full gap-2">
            <button className="flex-1 rounded-xl bg-surface/60 py-2 text-[12px] font-medium ring-1 ring-border hover:bg-surface">
              Mute
            </button>
            <button className="flex-1 rounded-xl bg-surface/60 py-2 text-[12px] font-medium ring-1 ring-border hover:bg-surface">
              Search
            </button>
            <button className="flex-1 rounded-xl bg-primary py-2 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90">
              Invite
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pinned
            </h5>
            <span className="text-[10px] text-muted-foreground">3</span>
          </div>
          <div className="rounded-2xl bg-surface/50 p-3 ring-1 ring-border">
            <p className="text-[12px] font-semibold">Weekly playbook</p>
            <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
              Read pinned rules before posting setups. Chart + thesis + invalidation.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Shared Media
            </h5>
            <button className="text-[11px] text-primary hover:underline">See all</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {media.map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg ring-1 ring-border"
                style={{
                  background: `linear-gradient(${135 + i * 20}deg, oklch(0.35 0.18 ${280 + i * 8}), oklch(0.15 0.05 ${280 + i * 12}))`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Members
            </h5>
            <span className="text-[10px] text-muted-foreground">
              {chat.members?.toLocaleString() ?? 0}
            </span>
          </div>
          <ul className="space-y-1">
            {["Julian Reyes", "Amir K.", "Elena Vance", "Marcus V.", "Sarah J."].map(
              (name, i) => (
                <li
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.03]"
                >
                  <Avatar seed={name} name={name} size={36} online={i < 2} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {i === 0 ? "Admin" : i === 1 ? "Moderator" : "Member"}
                    </p>
                  </div>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
