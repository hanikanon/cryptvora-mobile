import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell, usePageTransitionDirection, SWIPE_TABS } from "../components/app-shell";
import { ThemeProvider } from "../hooks/use-theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has flown off into the night.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return to Cryptvora
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The night is long. Try again or head back to your chats.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { name: "theme-color", content: "#000000" },
      { title: "Cryptvora — Premium community for traders" },
      {
        name: "description",
        content:
          "Cryptvora is a private, premium community platform built for traders. Group chats, channels, courses and memberships in one calm AMOLED experience.",
      },
      { name: "author", content: "Cryptvora" },
      { property: "og:title", content: "Cryptvora — Premium community for traders" },
      {
        property: "og:description",
        content:
          "A private members-only community for high-conviction crypto traders. Chats, channels, courses, and calm signal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cryptvora — Premium community for traders" },
      {
        name: "twitter:description",
        content: "Private, premium community platform for traders.",
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const direction = usePageTransitionDirection(path);
  const isChatThread = path.startsWith("/chat/");
  const isSwipeTab = (SWIPE_TABS as readonly string[]).includes(path);
  const xOffset = direction === "right" ? 28 : direction === "left" ? -28 : 0;

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <ThemeProvider>
        <AppShell>
          <AnimatePresence mode="popLayout" initial={false}>
            {isSwipeTab ? (
              // The horizontal swipe gesture already animates position/opacity for
              // these tabs — a second competing entrance here made things "pop" in.
              // Just a light, quick fade so direct (non-swipe) taps still feel smooth.
              <motion.div
                key={path}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            ) : (
              <motion.div
                key={path}
                initial={
                  isChatThread
                    ? { opacity: 0, x: 16 }
                    : { opacity: 0, x: xOffset, y: xOffset === 0 ? 8 : 0, scale: 0.985 }
                }
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
                style={{ willChange: "transform, opacity" }}
              >
                <Outlet />
              </motion.div>
            )}
          </AnimatePresence>
        </AppShell>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
