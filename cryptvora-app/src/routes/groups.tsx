import { createFileRoute, Link } from "@tanstack/react-router";
import { chats } from "@/lib/mock-data";
import { Avatar } from "@/components/avatar";
import { Users, Plus, Search } from "lucide-react";
import { VerificationBadge } from "@/components/verification-badge";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Groups — Cryptvora" },
      { name: "description", content: "Your private and public trader groups on Cryptvora." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const groups = chats.filter((c) => c.kind === "group");
  const featured = [
    {
      id: "alpha-desk",
      name: "Alpha Desk Global",
      members: 4820,
      hue: 300,
      tag: "Premium",
    },
    {
      id: "onchain-lab",
      name: "On-Chain Lab",
      members: 1240,
      hue: 275,
      tag: "Verified",
    },
    {
      id: "night-tape",
      name: "Night Tape Club",
      members: 380,
      hue: 320,
      tag: "Invite only",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 lg:px-8 lg:pt-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Groups</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Private communities. Members-only signal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden size-10 place-items-center rounded-full bg-surface/60 ring-1 ring-border hover:bg-surface sm:grid">
            <Search className="size-[18px] text-muted-foreground" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:bg-primary/90">
            <Plus className="size-4" /> New group
          </button>
        </div>
      </header>

      {/* Featured discovery */}
      <section className="mb-8">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Discover
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((g) => (
            <div
              key={g.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 transition-all hover:border-primary/40"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-40 transition-opacity group-hover:opacity-70"
                style={{
                  background: `radial-gradient(400px 200px at 0% 0%, oklch(0.55 0.2 ${g.hue} / 0.35), transparent)`,
                }}
              />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div
                    className="grid size-12 place-items-center rounded-2xl ring-1 ring-white/10"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.55 0.22 ${g.hue}), oklch(0.25 0.12 ${g.hue + 20}))`,
                    }}
                  >
                    <Users className="size-5 text-white" />
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {g.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {g.name}
                </h3>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {g.members.toLocaleString()} members
                </p>
                <button className="mt-4 w-full rounded-xl bg-white/[0.04] py-2 text-[12px] font-semibold ring-1 ring-border hover:bg-white/[0.08]">
                  Request access
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your groups */}
      <section>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Your groups
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/40">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                to="/chat/$id"
                params={{ id: g.id }}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-white/[0.03]"
              >
                <Avatar seed={g.avatarSeed} name={g.name} size={48} square />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-[15px] font-semibold">{g.name}</h3>
                    {g.verified && (
                      <VerificationBadge tier={g.badge ?? "verified"} size={14} />
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {g.members?.toLocaleString() ?? 0} members · {g.lastMessage}
                  </p>
                </div>
                {g.unread ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {g.unread}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
