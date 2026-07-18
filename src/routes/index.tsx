import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Search, Globe2, Users, TrendingUp, Compass,
  X, Bot, Radio, Hash, CalendarClock, FileText,
  Building2, Landmark, UserPlus, Check,
  MapPin,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { VerificationBadge, type BadgeTier } from "@/components/verification-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover — Cryptvora" },
      { name: "description", content: "The living heart of Cryptvora — trending traders, official exchanges, communities, bots, events and more, curated for you." },
    ],
  }),
  component: DiscoverPage,
});

/* ============================== Data ============================== */

type EntityType = "person" | "company" | "exchange" | "community" | "channel" | "group" | "bot" | "post" | "event";

interface Entity {
  id: string;
  name: string;
  handle: string;
  avatarSeed: string;
  isOwl?: boolean;
  brandDomain?: string;   // real logo via favicon service
  type: EntityType;
  badge?: BadgeTier;
  headline: string;
  followers: number;
  languages: string[];
  country: string;      // ISO-ish label
  flag: string;         // emoji
  region: "Global" | "Europe" | "Middle East" | "Asia" | "Americas";
  specialties: string[];
  online?: boolean;
  hot?: boolean;
  new?: boolean;
  growth?: number;      // % week-over-week
}

const E: Entity[] = [
  { id:"e1", name:"Binance", handle:"@binance", avatarSeed:"binance", brandDomain:"binance.com", type:"exchange", badge:"official", headline:"World's leading crypto exchange.", followers:12_800_000, languages:["English","Arabic","Turkish"], country:"Global", flag:"🌐", region:"Global", specialties:["Spot","Futures","Earn"], hot:true, growth:4 },
  { id:"e2", name:"Bybit", handle:"@bybit", avatarSeed:"bybit", brandDomain:"bybit.com", type:"exchange", badge:"official", headline:"Derivatives exchange for pros.", followers:4_100_000, languages:["English"], country:"Singapore", flag:"🇸🇬", region:"Asia", specialties:["Derivatives","Copy"], growth:6 },
  { id:"e3", name:"OKX Europe", handle:"@okx_eu", avatarSeed:"okx", brandDomain:"okx.com", type:"exchange", badge:"official", headline:"MiCA-regulated European exchange.", followers:890_000, languages:["English","French","German"], country:"Malta", flag:"🇲🇹", region:"Europe", specialties:["Spot","MiCA"], new:true, growth:22 },
  { id:"e4", name:"Coinbase", handle:"@coinbase", avatarSeed:"coinbase", brandDomain:"coinbase.com", type:"exchange", badge:"official", headline:"Trusted US onramp.", followers:6_200_000, languages:["English","Spanish"], country:"United States", flag:"🇺🇸", region:"Americas", specialties:["Custody","Spot"], growth:2 },
  { id:"e5", name:"Kraken", handle:"@kraken", avatarSeed:"kraken", brandDomain:"kraken.com", type:"exchange", badge:"official", headline:"Deep liquidity, since 2011.", followers:2_800_000, languages:["English"], country:"United States", flag:"🇺🇸", region:"Americas", specialties:["Spot","Staking"] },
  { id:"e6", name:"Bitget", handle:"@bitget", avatarSeed:"bitget", brandDomain:"bitget.com", type:"exchange", badge:"official", headline:"Copy trading & derivatives.", followers:2_100_000, languages:["English","Chinese"], country:"Seychelles", flag:"🌐", region:"Global", specialties:["Copy","Derivatives"], growth:14 },
  { id:"e7", name:"MEXC", handle:"@mexc", avatarSeed:"mexc", brandDomain:"mexc.com", type:"exchange", badge:"official", headline:"1,700+ pairs · zero-fee spot.", followers:1_600_000, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Spot","Altcoins"], hot:true, growth:11 },

  { id:"p1", name:"Julian Reyes", handle:"@jreyes", avatarSeed:"julian", type:"person", badge:"trader", headline:"BTC swing trader · 6y verified P&L.", followers:187_400, languages:["English","Spanish"], country:"Mexico", flag:"🇲🇽", region:"Americas", specialties:["BTC","Swing","Onchain"], online:true, hot:true, growth:18 },
  { id:"p2", name:"Layla Haddad", handle:"@laylafx", avatarSeed:"layla", type:"person", badge:"trader", headline:"FX price action · London session.", followers:92_100, languages:["Arabic","English"], country:"UAE", flag:"🇦🇪", region:"Middle East", specialties:["Forex","Gold","PA"], online:true, growth:12 },
  { id:"p3", name:"Marcus Ostrom", handle:"@ostromfx", avatarSeed:"marcus", type:"person", badge:"analyst", headline:"Macro & rates — chief strategist.", followers:341_000, languages:["English"], country:"United Kingdom", flag:"🇬🇧", region:"Europe", specialties:["Macro","Rates","DXY"], hot:true },
  { id:"p4", name:"Ayşe Demir", handle:"@aysetrades", avatarSeed:"ayse", type:"person", badge:"trader", headline:"Systematic futures & options.", followers:54_200, languages:["Turkish","English"], country:"Türkiye", flag:"🇹🇷", region:"Europe", specialties:["Futures","Options","Quant"], new:true, growth:38 },
  { id:"p5", name:"Nightowl", handle:"@nightowl", avatarSeed:"owl", isOwl:true, type:"person", badge:"premium-verified", headline:"Founder — Cryptvora.", followers:220_000, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Founder"], online:true, hot:true, growth:9 },
  { id:"p6", name:"Diego Salinas", handle:"@salinasfx", avatarSeed:"diego", type:"person", badge:"educator", headline:"40+ cohorts trained · systematic edge.", followers:128_000, languages:["Spanish","English"], country:"Argentina", flag:"🇦🇷", region:"Americas", specialties:["Education","Risk"], growth:7 },
  { id:"p7", name:"Ren Takahashi", handle:"@ren_takahashi", avatarSeed:"ren", type:"person", badge:"creator", headline:"Stocks & options — daily breakdowns.", followers:76_500, languages:["English","Japanese"], country:"Japan", flag:"🇯🇵", region:"Asia", specialties:["Stocks","Options"] },
  { id:"p8", name:"Isabelle Moreau", handle:"@isamm", avatarSeed:"isabelle", type:"person", badge:"leader", headline:"Runs Alpha Circle Europe.", followers:44_900, languages:["French","English"], country:"France", flag:"🇫🇷", region:"Europe", specialties:["Crypto","Community"] },
  { id:"p9", name:"Kade Miller", handle:"@kade_mm", avatarSeed:"kade", type:"person", badge:"verified", headline:"Market maker · L2 orderflow.", followers:33_100, languages:["English"], country:"United States", flag:"🇺🇸", region:"Americas", specialties:["MM","HFT"], online:true },
  { id:"p10", name:"Salma Osman", handle:"@salmafx", avatarSeed:"salma", type:"person", badge:"verified", headline:"Gold & majors signals.", followers:118_000, languages:["Arabic","English"], country:"Egypt", flag:"🇪🇬", region:"Middle East", specialties:["Signals","Gold"], hot:true, growth:15 },
  { id:"p11", name:"Nadia Rossi", handle:"@nadiar", avatarSeed:"nadia", type:"person", badge:"elite", headline:"ETH & L2 rotation specialist.", followers:210_000, languages:["Italian","English"], country:"Italy", flag:"🇮🇹", region:"Europe", specialties:["ETH","L2","DeFi"], growth:11 },
  { id:"p12", name:"Kai Yamamoto", handle:"@kaiyy", avatarSeed:"kai", type:"person", badge:"legendary", headline:"Legendary — 12yr track record.", followers:1_450_000, languages:["Japanese","English"], country:"Japan", flag:"🇯🇵", region:"Asia", specialties:["Macro","BTC","Gold"], hot:true },

  { id:"c1", name:"Cryptvora Labs", handle:"@cryptvora_labs", avatarSeed:"labs", type:"company", badge:"official", headline:"Research & tooling for pros.", followers:210_000, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Research","Tools"] },
  { id:"c2", name:"TradingView", handle:"@tradingview", avatarSeed:"tv", brandDomain:"tradingview.com", type:"company", badge:"official", headline:"Charts, screeners, ideas.", followers:8_400_000, languages:["English"], country:"United States", flag:"🇺🇸", region:"Americas", specialties:["Charts"], growth:3 },
  { id:"c3", name:"Glassnode", handle:"@glassnode", avatarSeed:"gn", brandDomain:"glassnode.com", type:"company", badge:"official", headline:"Onchain intelligence.", followers:640_000, languages:["English"], country:"Switzerland", flag:"🇨🇭", region:"Europe", specialties:["Onchain","Data"] },
  { id:"c4", name:"CoinGecko", handle:"@coingecko", avatarSeed:"cg", brandDomain:"coingecko.com", type:"company", badge:"official", headline:"Independent crypto data.", followers:1_100_000, languages:["English"], country:"Singapore", flag:"🇸🇬", region:"Asia", specialties:["Data","Prices"] },

  { id:"co1", name:"Alpha Circle", handle:"@alphacircle", avatarSeed:"alpha", type:"community", badge:"leader", headline:"Private community · 12k pros.", followers:12_400, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Premium","Crypto"], growth:24 },
  { id:"co2", name:"Desert Traders MENA", handle:"@desertmena", avatarSeed:"desert", type:"community", badge:"leader", headline:"Arabic-first trader circle.", followers:8_900, languages:["Arabic"], country:"UAE", flag:"🇦🇪", region:"Middle East", specialties:["MENA","Forex"], new:true, growth:41 },
  { id:"co3", name:"Nihon Alpha", handle:"@nihonalpha", avatarSeed:"nihon", type:"community", badge:"leader", headline:"Japan-based derivatives circle.", followers:5_200, languages:["Japanese","English"], country:"Japan", flag:"🇯🇵", region:"Asia", specialties:["Derivs"], growth:32 },

  { id:"ch1", name:"Cryptvora Signals", handle:"#signals", avatarSeed:"signals", type:"channel", badge:"official", headline:"High-conviction alerts, curated.", followers:74_000, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Signals"], hot:true, growth:19 },
  { id:"ch2", name:"Macro Watch", handle:"#macro", avatarSeed:"macro", type:"channel", badge:"analyst", headline:"Daily rates & FX briefing.", followers:28_200, languages:["English"], country:"United Kingdom", flag:"🇬🇧", region:"Europe", specialties:["Macro"] },

  { id:"g1", name:"ETH Whales", handle:"#ethwhales", avatarSeed:"ethw", type:"group", badge:"verified", headline:"Onchain flow · 1,200 members.", followers:1_200, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Onchain","ETH"] },

  { id:"b1", name:"AlphaBot", handle:"@alphabot", avatarSeed:"bot1", type:"bot", badge:"developer", headline:"Realtime whale-move alerts.", followers:18_200, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Alerts","Onchain"] },
  { id:"b2", name:"OrderflowBot", handle:"@ofbot", avatarSeed:"bot2", type:"bot", badge:"developer", headline:"Delta, CVD, footprint charts.", followers:9_400, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["Orderflow"], new:true, growth:28 },

  { id:"po1", name:"The BTC 2026 Roadmap", handle:"read", avatarSeed:"post1", type:"post", badge:"analyst", headline:"By Marcus Ostrom · 24 min read.", followers:21_400, languages:["English"], country:"Global", flag:"🌐", region:"Global", specialties:["BTC","Longform"] },
  { id:"ev1", name:"London Trader Meetup", handle:"Feb 22", avatarSeed:"event1", type:"event", badge:"official", headline:"Shoreditch · 220 going.", followers:220, languages:["English"], country:"United Kingdom", flag:"🇬🇧", region:"Europe", specialties:["IRL","Meetup"] },
  { id:"ev2", name:"Dubai Alpha Summit", handle:"Mar 14", avatarSeed:"event2", type:"event", badge:"official", headline:"DIFC · invite only.", followers:640, languages:["Arabic","English"], country:"UAE", flag:"🇦🇪", region:"Middle East", specialties:["Summit"] },
];

/* ============================ Filters ============================ */

interface BadgeFilter { id:string; label:string; match:(e:Entity)=>boolean }
const BADGE_FILTERS: BadgeFilter[] = [
  { id:"all", label:"All", match:()=>true },
  { id:"companies", label:"Official Companies", match:e=>e.type==="company"&&e.badge==="official" },
  { id:"exchanges", label:"Official Exchanges", match:e=>e.type==="exchange" },
  { id:"crypto", label:"Crypto Traders", match:e=>e.badge==="trader"&&e.specialties.some(t=>/btc|eth|crypto|sol|onchain/i.test(t)) },
  { id:"forex", label:"Forex Traders", match:e=>e.specialties.includes("Forex") },
  { id:"stocks", label:"Stocks Traders", match:e=>e.specialties.includes("Stocks") },
  { id:"futures", label:"Futures Traders", match:e=>e.specialties.includes("Futures") },
  { id:"options", label:"Options Traders", match:e=>e.specialties.includes("Options") },
  { id:"mm", label:"Market Makers", match:e=>e.specialties.includes("MM") },
  { id:"edu", label:"Trading Educators", match:e=>e.badge==="educator" },
  { id:"creators", label:"Content Creators", match:e=>e.badge==="creator" },
  { id:"signals", label:"Signal Providers", match:e=>e.specialties.includes("Signals") },
  { id:"leaders", label:"Community Leaders", match:e=>e.badge==="leader" },
  { id:"bots", label:"Bots", match:e=>e.type==="bot" },
  { id:"premium", label:"Premium Members", match:e=>e.badge==="premium"||e.badge==="premium-verified" },
  { id:"elite", label:"Elite Members", match:e=>e.badge==="elite" },
  { id:"legendary", label:"Legendary Members", match:e=>e.badge==="legendary" },
];

const TYPE_FILTERS: { id:EntityType|"all"; label:string; icon:React.ComponentType<{className?:string}> }[] = [
  { id:"all", label:"All", icon:Compass },
  { id:"person", label:"People", icon:Users },
  { id:"company", label:"Companies", icon:Building2 },
  { id:"exchange", label:"Exchanges", icon:Landmark },
  { id:"community", label:"Communities", icon:Users },
  { id:"channel", label:"Channels", icon:Radio },
  { id:"group", label:"Groups", icon:Hash },
  { id:"bot", label:"Bots", icon:Bot },
  { id:"post", label:"Posts", icon:FileText },
  { id:"event", label:"Events", icon:CalendarClock },
];

/* ============================= Utils ============================= */

function formatCount(n:number):string {
  if (n>=1_000_000) return (n/1_000_000).toFixed(n>=10_000_000?0:1).replace(/\.0$/,"")+"M";
  if (n>=1_000) return (n/1_000).toFixed(n>=10_000?0:1).replace(/\.0$/,"")+"K";
  return String(n);
}

function brandLogoUrl(domain?: string, size = 128): string | undefined {
  if (!domain) return undefined;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/* ============================== Page ============================== */

function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [badgeId, setBadgeId] = useState("all");
  const [typeId, setTypeId] = useState<EntityType|"all">("all");
  const [region, setRegion] = useState<"Any"|Entity["region"]>("Any");
  const [language, setLanguage] = useState<string>("Any");
  const [minFollowers, setMinFollowers] = useState<number>(0);

  const activeBadge = BADGE_FILTERS.find(b=>b.id===badgeId) ?? BADGE_FILTERS[0];

  const isFiltering = query.trim().length>0 || badgeId!=="all" || typeId!=="all" || region!=="Any" || language!=="Any" || minFollowers>0;

  const results = useMemo(()=>{
    const q = query.trim().toLowerCase();
    return E.filter(e=>{
      if (!activeBadge.match(e)) return false;
      if (typeId!=="all" && e.type!==typeId) return false;
      if (region!=="Any" && e.region!==region) return false;
      if (language!=="Any" && !e.languages.includes(language)) return false;
      if (e.followers<minFollowers) return false;
      if (q) {
        const hay = (e.name+" "+e.handle+" "+e.headline+" "+e.specialties.join(" ")+" "+e.country+" "+e.languages.join(" ")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, activeBadge, typeId, region, language, minFollowers]);

  return (
    <div className="min-h-screen animate-page-enter">
      {/* Sticky top: search only */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 pb-3.5 pt-1 lg:px-8">
          <SearchBar query={query} onQueryChange={setQuery} />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-24 lg:px-8">
        {/* Filters */}
        <div className="mt-4">
          <TypeChips value={typeId} onChange={setTypeId} />
          <BadgeChips value={badgeId} onChange={setBadgeId} />
          <QuickFilters
            region={region} setRegion={setRegion}
            language={language} setLanguage={setLanguage}
            minFollowers={minFollowers} setMinFollowers={setMinFollowers}
          />
        </div>

        <section className="mt-8">
          <div className="mb-2.5 flex items-end justify-between">
            <p className="text-[11px] font-medium text-muted-foreground/70">
              {results.length} {results.length===1?"result":"results"}
            </p>
            {isFiltering && (
              <button
                onClick={()=>{setQuery("");setBadgeId("all");setTypeId("all");setRegion("Any");setLanguage("Any");setMinFollowers(0);}}
                className="press text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>
          <LayoutGroup>
            <motion.div layout className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map(e=><EntityCard key={e.id} entity={e} />)}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
          {results.length===0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-14 text-center">
              <p className="text-[14.5px] font-semibold">No matches yet</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Widen your filters to explore what Cryptvora is watching.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============================ Search bar ============================ */

function SearchBar({ query, onQueryChange }:{query:string; onQueryChange:(v:string)=>void}) {
  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 transition-shadow focus-within:ring-brand">
        <Search className="size-[18px] text-muted-foreground" />
        <input
          value={query}
          onChange={e=>onQueryChange(e.target.value)}
          type="text"
          placeholder="Search people, exchanges, communities, bots, posts…"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={()=>onQueryChange("")}
            className="press grid size-6 place-items-center rounded-full bg-white/[0.06] text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <X className="size-3.5" />
          </button>
        )}
        <span className="hidden items-center gap-1 rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-flex">⌘K</span>
      </div>
    </div>
  );
}

/* ============================ Type chips ============================ */

function TypeChips({ value, onChange }:{value:EntityType|"all"; onChange:(v:EntityType|"all")=>void}) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <LayoutGroup id="type-tabs">
        <div className="flex min-w-max items-end gap-7 sm:gap-8">
          {TYPE_FILTERS.map(f=>{
            const active = value===f.id;
            return (
              <button
                key={f.id}
                onClick={()=>onChange(f.id)}
                className={cn(
                  "relative shrink-0 bg-transparent px-0 pb-2.5 pt-1 text-[15px] leading-none transition-colors duration-200",
                  active
                    ? "font-semibold text-white"
                    : "font-medium text-[#8A8A8A] hover:text-white/80",
                )}
              >
                <span>{f.label}</span>
                {active && (
                  <motion.span
                    layoutId="type-tab-underline"
                    className="absolute inset-x-0 -bottom-px h-[2px] bg-white"
                    transition={{ type:"spring", stiffness:420, damping:34 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

function BadgeChips({ value, onChange }:{value:string; onChange:(v:string)=>void}) {
  return (
    <div className="mt-4">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <LayoutGroup id="badge-chips">
          {BADGE_FILTERS.map(f=>{
            const active = value===f.id;
            return (
              <button
                key={f.id}
                onClick={()=>onChange(f.id)}
                className={cn(
                  "press relative inline-flex shrink-0 items-center rounded-full px-3.5 py-1 text-[12.5px] font-medium transition-colors duration-200",
                  active ? "text-primary" : "text-[#8A8A8A] hover:text-white/85",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="badge-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "color-mix(in oklab, var(--primary) 14%, transparent)" }}
                    transition={{ type:"spring", stiffness:380, damping:32 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </LayoutGroup>
      </div>
    </div>
  );
}

/* ========================== Quick filters =========================== */

const REGIONS: ("Any"|Entity["region"])[] = ["Any","Global","Europe","Middle East","Asia","Americas"];
const LANGUAGES = ["Any","English","Arabic","Spanish","French","Turkish","Japanese","Italian","German"];
const TIERS = [
  { id:0, label:"Any size" },
  { id:10_000, label:"10K+" },
  { id:100_000, label:"100K+" },
  { id:1_000_000, label:"1M+" },
];

function QuickFilters({
  region, setRegion, language, setLanguage, minFollowers, setMinFollowers,
}:{
  region:"Any"|Entity["region"]; setRegion:(v:"Any"|Entity["region"])=>void;
  language:string; setLanguage:(v:string)=>void;
  minFollowers:number; setMinFollowers:(v:number)=>void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <MiniSelect icon={MapPin} label="Region" value={region} options={REGIONS} onChange={v=>setRegion(v as any)} />
      <MiniSelect icon={Globe2} label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
      <MiniSelect
        icon={Users} label="Followers"
        value={TIERS.find(t=>t.id===minFollowers)!.label}
        options={TIERS.map(t=>t.label)}
        onChange={label=>setMinFollowers(TIERS.find(t=>t.label===label)!.id)}
      />
    </div>
  );
}

function MiniSelect({ icon:Icon, label, value, options, onChange }:{
  icon:React.ComponentType<{className?:string}>; label:string; value:string;
  options:readonly string[]; onChange:(v:string)=>void;
}) {
  const [open,setOpen] = useState(false);
  const active = !["Any","Any size"].includes(value);
  return (
    <div className="relative">
      <button
        onClick={()=>setOpen(v=>!v)}
        className={cn(
          "press inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[12.5px] font-medium transition-all duration-200",
          active
            ? "bg-primary/15 text-primary shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
            : "bg-white/[0.045] text-[#B4B4B4] hover:bg-white/[0.07] hover:text-white shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]",
        )}
      >
        <Icon className="size-3.5 opacity-90" />
        <span className={cn("opacity-70", active && "opacity-80")}>{label}</span>
        <span className="font-semibold tracking-tight">{value}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button aria-hidden className="fixed inset-0 z-30" onClick={()=>setOpen(false)} />
            <motion.div
              initial={{opacity:0,y:-8,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6,scale:0.97}}
              transition={{type:"spring", stiffness:420, damping:32, mass:0.7}}
              style={{ transformOrigin:"top left", backgroundColor:"#0B0B0D" }}
              className="absolute left-0 top-[calc(100%+8px)] z-40 min-w-[240px] overflow-hidden rounded-[20px] p-2 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.04]"
            >
              <div className="px-3 pb-2 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
                {label}
              </div>
              <div className="flex flex-col gap-0.5">
                {options.map(o=>{
                  const isActive = o===value;
                  return (
                    <button
                      key={o}
                      onClick={()=>{onChange(o);setOpen(false)}}
                      className={cn(
                        "flex min-h-12 w-full items-center justify-between rounded-xl px-3.5 text-[14px] font-medium transition-colors duration-150 active:scale-[0.985]",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/90 hover:bg-white/[0.05] active:bg-white/[0.08]",
                      )}
                    >
                      <span>{o}</span>
                      {isActive && <Check className="size-[18px]" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================= Cards ============================= */

function EntityCard({ entity, inRail=false }:{entity:Entity; inRail?:boolean}) {
  const TypeIcon = TYPE_FILTERS.find(t=>t.id===entity.type)?.icon ?? Compass;
  return (
    <motion.article
      layout
      initial={{ opacity:0, y:10, scale:0.98 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, scale:0.96 }}
      transition={{ type:"spring", stiffness:320, damping:28, mass:0.7 }}
      whileHover={{ y:-2 }}
      className={cn(
        "group relative snap-start overflow-hidden rounded-2xl border border-border bg-surface/60 px-3.5 py-3 shadow-soft transition-colors duration-200 hover:border-border-strong hover:bg-surface",
        inRail && "w-[280px] shrink-0",
      )}
    >
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40" style={{background:"var(--gradient-brand)"}} />

      <div className="relative flex items-start gap-3">
        <div className="relative">
          <Avatar
            seed={entity.avatarSeed} name={entity.name} size={42}
            isOwl={entity.isOwl}
            logoUrl={brandLogoUrl(entity.brandDomain)}
            square={entity.type==="company"||entity.type==="exchange"}
            ring={entity.badge==="premium-verified"||entity.badge==="legendary"}
          />
          {entity.online && (
            <span aria-hidden className="absolute -right-0.5 -bottom-0.5 grid size-3 place-items-center rounded-full bg-background">
              <span className="size-2 rounded-full bg-[oklch(0.72_0.17_155)] animate-pulse-dot" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[14px] font-semibold leading-tight">{entity.name}</p>
            <VerificationBadge tier={entity.badge} size={12} />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <span>{entity.handle}</span>
            <span aria-hidden>·</span>
            <span aria-hidden>{entity.flag}</span>
            <span className="truncate">{entity.country}</span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/[0.035] px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-muted-foreground/80">
          <TypeIcon className="size-2.5" />
          {entity.type}
        </span>
      </div>

      <p className="relative mt-2.5 line-clamp-2 text-[12.5px] leading-snug text-foreground/80">{entity.headline}</p>

      <div className="relative mt-2.5 flex flex-wrap gap-1">
        {entity.specialties.slice(0,3).map(t=>(
          <span key={t} className="rounded-md bg-white/[0.035] px-1.5 py-[3px] text-[9.5px] font-medium leading-none text-muted-foreground/85">{t}</span>
        ))}
        {entity.languages.slice(0,2).map(l=>(
          <span key={l} className="rounded-md bg-primary/8 px-1.5 py-[3px] text-[9.5px] font-medium leading-none text-primary/85">{l}</span>
        ))}
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Users className="size-3" />{formatCount(entity.followers)}</span>
          {entity.growth ? (
            <span className="inline-flex items-center gap-1 text-[oklch(0.72_0.17_155)]"><TrendingUp className="size-3" />+{entity.growth}%</span>
          ) : (
            <span className="inline-flex items-center gap-1"><Globe2 className="size-3" />{entity.region}</span>
          )}
        </div>
        <FollowButton />
      </div>
    </motion.article>
  );
}

/* ============================ Follow btn ============================ */

interface Ripple { id:number; x:number; y:number }

function FollowButton() {
  const [following, setFollowing] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++nextId.current;
    setRipples(r=>[...r,{ id, x:e.clientX-rect.left, y:e.clientY-rect.top }]);
    setTimeout(()=>setRipples(r=>r.filter(x=>x.id!==id)), 620);
    setFollowing(f=>!f);
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale:0.94 }}
      className={cn(
        "relative overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-semibold text-white transition-colors duration-200",
        following
          ? "bg-white/[0.05] text-foreground/90 ring-1 ring-border"
          : "bg-[linear-gradient(180deg,var(--primary),color-mix(in_oklab,var(--primary)_88%,black))] shadow-[0_2px_10px_-4px_color-mix(in_oklab,var(--primary)_45%,transparent)]",
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-1">
        <AnimatePresence mode="wait" initial={false}>
          {following ? (
            <motion.span key="f" initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.6}} transition={{duration:0.18}} className="inline-flex items-center gap-1">
              <Check className="size-3" /> Following
            </motion.span>
          ) : (
            <motion.span key="u" initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.6}} transition={{duration:0.18}} className="inline-flex items-center gap-1">
              <UserPlus className="size-3" /> Follow
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {ripples.map(r=>(
        <motion.span
          key={r.id} aria-hidden
          initial={{ opacity:0.3, scale:0 }}
          animate={{ opacity:0, scale:6 }}
          transition={{ duration:0.5, ease:"easeOut" }}
          style={{ left:r.x, top:r.y }}
          className="pointer-events-none absolute -ml-2 -mt-2 h-4 w-4 rounded-full bg-white/60"
        />
      ))}
    </motion.button>
  );
}
