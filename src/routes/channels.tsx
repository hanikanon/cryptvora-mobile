import { createFileRoute, Link } from "@tanstack/react-router";
import { chats } from "@/lib/mock-data";
import { Avatar } from "@/components/avatar";
import { Radio, TrendingUp } from "lucide-react";
import { VerificationBadge } from "@/components/verification-badge";
import { OwlMark } from "@/components/logo";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Channels — Cryptvora" },
      {
        name: "description",
        content: "Follow premium broadcast channels from top traders on Cryptvora.",
      },
    ],
  }),
  component: ChannelsPage,
});

function ChannelsPage() {
  const channels = chats.filter((c) => c.kind === "channel");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 lg:px-8 lg:pt-8">
      {/* Hero */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-surface/40 p-6 lg:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(700px 320px at 100% 0%, color-mix(in oklab, var(--primary) 32%, transparent), transparent)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <OwlMark size={64} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Official channel
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
                Cryptvora Announcements
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                12,480 subscribers · Verified
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/chat/$id"
              params={{ id: "announcements" }}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open channel
            </Link>
            <button className="inline-flex items-center justify-center rounded-xl bg-surface/60 px-4 py-2.5 text-[13px] font-semibold ring-1 ring-border hover:bg-surface">
              Share
            </button>
          </div>
        </div>
      </section>

      {/* Trending channels */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Trending
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <TrendingUp className="size-3 text-success" /> live
          </span>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {channels.map((ch) => (
            <li key={ch.id}>
              <Link
                to="/chat/$id"
                params={{ id: ch.id }}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-surface/40 p-4 transition-all hover:border-primary/40"
              >
                <Avatar
                  seed={ch.avatarSeed}
                  name={ch.name}
                  size={52}
                  square
                  isOwl={ch.avatarSeed === "owl"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-[15px] font-semibold">{ch.name}</h3>
                    {ch.verified && <VerificationBadge tier={ch.badge ?? "verified"} size={14} />}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    <Radio className="mr-1 inline size-3" />
                    {ch.members?.toLocaleString() ?? 0} subscribers
                  </p>
                </div>
                <button className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold ring-1 ring-border transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-transparent">
                  Follow
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
