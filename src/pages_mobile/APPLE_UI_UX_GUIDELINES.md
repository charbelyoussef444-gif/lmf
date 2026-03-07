# Apple-style UI/UX checklist applied to mobile pages

This mobile layer is designed to align with Apple Human Interface Guidelines patterns commonly seen in iOS apps and expected by App Store review teams.

## Principles implemented

1. **Clarity**
   - Large title treatment in the top area.
   - High-contrast primary action color (`#007AFF` style blue).
   - Reduced visual noise with generous whitespace and grouped cards.

2. **Deference**
   - Content-first layout where chrome is lightweight (soft separators, translucent header/nav).
   - Avoid aggressive gradients in navigation chrome.

3. **Depth**
   - Subtle blur + layered surfaces for hierarchy (header, drawer, bottom tab bar).
   - Elevation used to indicate interaction targets.

4. **Touch ergonomics**
   - Bottom tab bar for thumb reach.
   - 44px-ish tap targets for menu and key controls.
   - Safe-area insets respected for iPhone notch/home indicator.

5. **Navigation predictability**
   - Persistent tab bar for core destinations.
   - Hamburger side menu for extended destinations (admin + deep links).

6. **Consistency with existing product logic**
   - Existing page logic/components remain unchanged.
   - New mobile pages are wrappers that preserve business behavior while presenting mobile-first framing.

## App Store readiness notes

- Keep sign-in, account deletion, and privacy disclosures visible and accessible.
- Ensure links and legal text remain readable at default text size.
- Validate dark mode contrast and Dynamic Type compatibility before submission.
- Verify loading/error states are non-blocking and user-friendly.
