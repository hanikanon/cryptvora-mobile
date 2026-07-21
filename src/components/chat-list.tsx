import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { BellOff, Pin, Radio, Users, Archive, VolumeX, ShieldOff, Trash2, X, Bookmark } from "lucide-react";
import { VerificationBadge } from "@/components/verification-badge";
import { Avatar } from "@/components/avatar";
import { BottomSheet } from "@/components/bottom-sheet";
import { chats as initialChats, type Chat } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const filters = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
  { id: "channels", label: "Channels" },
  { id: "dm", label: "Direct" },
];

function filterCount(id: string, chats: Chat[]) {
  if (id === "all") return chats.reduce((n, c) => n + (c.unread ?? 0), 0);
  if (id === "unread") return chats.filter((c) => (c.unread ?? 0) > 0).length;
  if (id === "groups") return chats.filter((c) => c.kind === "group").length;
  if (id === "channels") return chats.filter((c) => c.kind === "channel").length;
  return chats.filter((c) => c.kind === "dm").length;
}

function KindIcon({ chat }: { chat: Chat }) {
  if (chat.kind === "channel") return <Radio className="size-3" />;
  if (chat.kind === "group") return <Users className="size-3" />;
  return null;
}

/** Swipe a row left to reveal a delete block underneath — drag past ~50px
 * (or flick) to snap it open, tap the row again to close it, tap the red
 * block to actually delete. Only x/opacity ever animate, so it's cheap. */
function SwipeableRow({ onDelete, children }: { onDelete: () => void; children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 z-0 w-20">
        <motion.button
          type="button"
          onClick={onDelete}
          initial={false}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-r-2xl bg-red-500 text-white"
        >
          <Trash2 className="size-[18px]" />
          <span className="text-[10px] font-medium">Delete</span>
        </motion.button>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        dragMomentum={false}
        animate={{ x: revealed ? -80 : 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 42 }}
        onDragEnd={(_, info) => setRevealed(info.offset.x < -45)}
        onClick={(e) => {
          if (revealed) {
            e.preventDefault();
            e.stopPropagation();
            setRevealed(false);
          }
        }}
        className="relative z-10 rounded-2xl bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ChatList({
  activeId,
  onSelect,
}: {
  activeId?: string;
  onSelect: (chat: Chat) => void;
}) {
  const derivedActive = activeId;
  const [chats, setChats] = useState(initialChats);
  const [menuChat, setMenuChat] = useState<Chat | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const startPress = (c: Chat) => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
      setMenuChat(c);
    }, 420);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };
  const guardClick = (e: React.MouseEvent) => {
    if (longPressed.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setMenuChat((prev) => (prev?.id === id ? null : prev));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Filter pills */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3 lg:px-5">
        {filters.map((f, i) => (
          <button
            key={f.id}
            type="button"
            className={cn(
              "press flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              i === 0
                ? "bg-primary text-primary-foreground ring-1 ring-border-strong"
                : "bg-surface/60 text-muted-foreground ring-1 ring-border hover:text-foreground",
            )}
          >
            {f.label}
            {filterCount(f.id, chats) > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                  i === 0 ? "bg-white/25 text-primary-foreground" : "bg-foreground/10 text-foreground",
                )}
              >
                {filterCount(f.id, chats)}
              </span>
            )}
          </button>
        ))}
      </div>

      <ul className="flex-1 overflow-y-auto px-2 pb-24 lg:pb-2">
        <li>
          <button
            type="button"
            onClick={() => onSelect({ id: "saved", name: "Saved Messages", kind: "dm", avatarSeed: "saved", lastMessage: "", time: "" })}
            className="press flex w-full items-center gap-3.5 rounded-2xl p-3 text-left transition-all hover:bg-black/[0.03]"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Bookmark className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-semibold leading-snug">Saved Messages</p>
              <p className="truncate text-[13px] text-muted-foreground">Notes to self, pinned links, drafts</p>
            </div>
          </button>
        </li>
        {chats.map((c) => {
          const isActive = derivedActive === c.id;
          return (
            <li key={c.id}>
              <SwipeableRow onDelete={() => deleteChat(c.id)}>
              <button
                type="button"
                onClick={(e) => {
                  guardClick(e);
                  if (!longPressed.current) onSelect(c);
                }}
                onPointerDown={() => startPress(c)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
                className={cn(
                  "press flex w-full items-center gap-3.5 rounded-2xl p-3 text-left transition-all",
                  isActive
                    ? "bg-black/[0.04] ring-1 ring-border-strong"
                    : "hover:bg-black/[0.03]",
                )}
              >
                <Avatar
                  seed={c.avatarSeed}
                  name={c.name}
                  size={52}
                  isOwl={c.avatarSeed === "owl"}
                  online={c.kind === "dm" ? c.online : undefined}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-baseline justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {c.kind !== "dm" && (
                        <span className="text-muted-foreground">
                          <KindIcon chat={c} />
                        </span>
                      )}
                      <h3 className="truncate text-[15px] font-semibold tracking-tight">
                        {c.name}
                      </h3>
                      {c.verified && (
                        <VerificationBadge tier={c.badge ?? "verified"} size={14} />
                      )}
                      {c.muted && (
                        <BellOff className="size-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-medium",
                        c.unread ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {c.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "min-w-0 flex-1 truncate text-[13px] leading-relaxed",
                        c.typing
                          ? "text-primary"
                          : c.unread
                            ? "text-foreground/85"
                            : "text-muted-foreground",
                      )}
                    >
                      {c.typing ? (
                        <span className="inline-flex items-center gap-1.5">
                          typing
                          <span className="flex gap-0.5">
                            <span className="size-1 rounded-full bg-primary animate-pulse-dot" />
                            <span
                              className="size-1 rounded-full bg-primary animate-pulse-dot"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="size-1 rounded-full bg-primary animate-pulse-dot"
                              style={{ animationDelay: "300ms" }}
                            />
                          </span>
                        </span>
                      ) : (
                        <>
                          {c.lastAuthor && (
                            <span className="text-foreground/70">
                              {c.lastAuthor}:{" "}
                            </span>
                          )}
                          {c.lastMessage}
                        </>
                      )}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {c.pinned && <Pin className="size-3 text-muted-foreground" />}
                      {c.unread ? (
                        <motion.span
                          key={c.unread}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          className="grid min-w-[20px] place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
                        >
                          {c.unread}
                        </motion.span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
              </SwipeableRow>
            </li>
          );
        })}
      </ul>

      {/* Long-press context menu */}
      <BottomSheet open={!!menuChat} onClose={() => setMenuChat(null)} className="light">
        {menuChat && (
          <>
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Avatar seed={menuChat.avatarSeed} name={menuChat.name} size={36} isOwl={menuChat.avatarSeed === "owl"} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{menuChat.name}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuChat(null)}
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground"
              >
                <X className="size-4" />
              </motion.button>
            </div>
            <div className="px-2 py-1">
              {[
                { icon: Pin, label: menuChat.pinned ? "Unpin" : "Pin" },
                { icon: menuChat.muted ? BellOff : VolumeX, label: menuChat.muted ? "Unmute" : "Mute" },
                { icon: Archive, label: "Archive" },
                { icon: ShieldOff, label: "Block", danger: true },
                { icon: Trash2, label: "Delete chat", danger: true, action: "delete" },
              ].map((action) => (
                <motion.button
                  key={action.label}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={() => (action.action === "delete" ? deleteChat(menuChat.id) : setMenuChat(null))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium hover:bg-black/[0.04]",
                    action.danger ? "text-red-400" : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg",
                      action.danger ? "bg-red-400/12" : "bg-black/[0.05]",
                    )}
                  >
                    <action.icon className="size-[17px]" />
                  </span>
                  {action.label}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
