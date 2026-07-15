# Cryptvora Settings — Android build (Capacitor)

## What changed from your upload, and why

Your zip was a **Lovable.dev / TanStack Start** project (server-rendered, needs a
Node server at runtime — it was deploying to Cloudflare via Nitro). Capacitor
doesn't run a server: it loads a folder of static files into an Android WebView.

Your settings screen has no server calls (checked every file — it's all local
`useState`/`SettingsContext`), so I dropped the TanStack Start/Router server
shell and mounted the exact same components (`SettingsApp`, `SettingsContext`,
`AppearanceScreen`, `EditProfileScreen`, `AvatarSheet`, `QRScreen`,
`ProfileHeader`, `SettingGroup`, `SettingItem`, `Toggle`, `BottomSheet`, and all
46 shadcn/ui primitives) as a plain client-side Vite React app. Every component
file is byte-identical to what you uploaded — same Tailwind classes, same
Framer Motion animations, same icons, same fonts, same interactions. Only
`main.tsx`/`App.tsx` (the bootstrap) and the build config are new.

The zip also had all files flattened into one folder with no subdirectories —
I reconstructed `src/components/ui`, `src/components/settings`, `src/lib`,
`src/hooks` from the import paths inside the files themselves.

## What I could not do here

I don't have internet access or an Android SDK in this sandbox, so I can't run
`npm install`, `npx cap add android`, or Gradle myself. Everything below is
prepared and ready — you just need to run it once, either on your own machine
or via the GitHub Actions workflow I included (recommended, since Termux
can't realistically run a full Android Gradle build).

## Option A — GitHub Actions (recommended, no local Android SDK needed)

1. Push this project to a GitHub repo (fits your existing `hanikanon/...` setup).
2. Go to **Actions → Build Android APK → Run workflow** (or just push to `main`).
3. When it finishes, download the `cryptvora-debug-apk` artifact — that's your
   installable `.apk`.

The workflow (`.github/workflows/build-android.yml`) does `npm install` →
`npm run build` → `npx cap add android` → `npx cap sync` →
`./gradlew assembleDebug`, all headlessly on GitHub's runners.

## Option B — Locally / Termux (needs network + Android SDK + JDK 21)

```bash
npm install
npx cap add android      # generates the android/ project — only run this once
npm run build
npx cap sync android
cd android
./gradlew assembleDebug  # -> android/app/build/outputs/apk/debug/app-debug.apk
```

To open in Android Studio instead of the CLI: `npm run android`.

> Termux note: `npx cap add android` and `npm install` will work fine there,
> but `./gradlew assembleDebug` needs the Android SDK + build-tools, which is
> painful to get fully working in Termux. Option A avoids that entirely.

## After the first build

- App id: `com.cryptvora.settings` — change in `capacitor.config.ts` and
  `android/app/build.gradle` (`applicationId`) if you want something else.
- App icon / splash screen: Capacitor generates placeholder ones. Replace via
  `npx @capacitor/assets generate` once you have your real icon/splash source
  images, or edit `android/app/src/main/res/mipmap-*` directly.
- To wire up the real trading/auth backend later, `App.tsx` already has
  `QueryClientProvider` from `@tanstack/react-query` in place, matching your
  SaaS infra.
- Every subsequent code change: `npm run build && npx cap sync android`, then
  rebuild the APK (or re-run the GitHub Action).
