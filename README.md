# LikeMind (React + TypeScript + Vite).

This project is currently a web app built with React, TypeScript, and Vite.

## Run locally

```bash
npm install
npm run dev
```

## I want this to be a mobile app. What should I do?

The fastest path is to **wrap your existing React web app with Capacitor** so it runs as a native iOS/Android app while reusing almost all of your current code.

## ✅ First-step mobile readiness already implemented in this repo

- Mobile browsers are no longer gated to a placeholder page.
- Routing now auto-switches to `HashRouter` in a native runtime (Capacitor-compatible).
- Safe-area insets are applied for notched devices.
- Mobile web app `<meta>` tags are configured in `index.html`.

### Recommended approach (Capacitor)

1. **Keep this codebase as the UI layer**
   - Keep building your app in React as you are now.
   - Make layouts mobile-first (responsive breakpoints, touch targets, safe-area support).

2. **Add Capacitor**

```bash
npm install @capacitor/core @capacitor/cli
npx cap init likemind com.likemind.app --web-dir=dist
```

If your environment blocks package installs, run the same commands on your local machine.

3. **Build and sync**

```bash
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

4. **Open native projects**

```bash
npx cap open ios
npx cap open android
```

## Where can I view it on mobile right now?

### Option A: mobile browser (quickest)

1. Run dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

2. On your phone (same Wi-Fi), open:

```text
http://<your-computer-local-ip>:4173
```

### Option B: native simulator/device (Capacitor)

After `npx cap add ios` / `npx cap add android`, use Xcode/Android Studio to run directly to simulator or a connected device.

## Can users download the app yet?

Not yet from App Store / Play Store.

First build and sign binaries:

- Android: generate `APK`/`AAB` from Android Studio.
- iOS: archive/sign in Xcode for TestFlight/App Store.

For internal testing only, you can share APK (Android) or TestFlight invite (iOS).

5. **Implement mobile-specific features (as needed)**
   - Push notifications
   - Camera / photo upload
   - Biometric auth
   - Deep links
   - Native splash + app icons

### Product checklist before shipping

- [ ] Make every screen responsive for small widths (320px+).
- [ ] Ensure auth/session flow works after app resume/background.
- [ ] Handle offline/poor-network states cleanly.
- [ ] Add loading/error states for all API calls.
- [ ] Configure iOS/Android app IDs, icons, splash screen, and permissions.
- [ ] Test on physical devices (not just simulators).

### Alternative path: React Native (full native rewrite)

If you want fully native UI performance and patterns, use React Native / Expo.

- **Pros:** more native look/feel, better for complex native interactions.
- **Cons:** requires rewriting most UI components from this web app.

For your current codebase, **Capacitor is usually the best first step**.
