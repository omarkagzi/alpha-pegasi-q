# Landing Page Integration — File Map

Files added to `Project_Alpha_Pegasi_q` when the standalone `Landing Page/` project was merged in.

---

## Entry Points

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Root route (`/`) — renders the landing page sections |
| `src/app/layout.tsx` | Root layout — IBM Plex Sans, IBM Plex Mono, Bebas Neue fonts added; noise overlay div added |
| `src/app/globals.css` | Global styles — dark design tokens, `.landing-page` scoped overrides, `.noise-overlay`, `.grid-bg` |

---

## Landing Page Sections

All live in `src/components/landing/`.

| File | Purpose |
|---|---|
| `hero-section.tsx` | Hero / above-the-fold section |
| `work-section.tsx` | Work / agents showcase section |
| `principles-section.tsx` | Principles section |
| `colophon-section.tsx` | Footer / colophon section |
| `side-nav.tsx` | Fixed side navigation dots |
| `smooth-scroll.tsx` | Lenis smooth scroll wrapper (used in `page.tsx`) |
| `theme-provider.tsx` | next-themes provider |
| `animated-noise.tsx` | Animated noise texture component |
| `bitmap-chevron.tsx` | Bitmap-style chevron graphic |
| `draw-text.tsx` | SVG draw-on text animation |
| `highlight-text.tsx` | Highlighted text animation |
| `scramble-text.tsx` | Text scramble animation |
| `split-flap-text.tsx` | Split-flap display animation |
| `signals-section.tsx` | Signals section (stub — content deferred) |

---

## UI Component Library

`src/components/ui/` — 57 shadcn/ui components available app-wide.

Examples: `button.tsx`, `dialog.tsx`, `card.tsx`, `accordion.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, etc.

---

## Utilities & Hooks

| File | Purpose |
|---|---|
| `src/lib/utils.ts` | `cn()` helper — clsx + tailwind-merge |
| `src/hooks/use-mobile.ts` | Mobile breakpoint detection hook |
| `src/hooks/use-toast.ts` | Toast notification hook |

---

## Public Assets

All in `public/`.

| File | Purpose |
|---|---|
| `icon.svg` | SVG favicon |
| `icon-light-32x32.png` | Favicon for light mode |
| `icon-dark-32x32.png` | Favicon for dark mode |
| `apple-icon.png` | Apple touch icon |

---

## Config

| File | Purpose |
|---|---|
| `components.json` | shadcn/ui config at project root — aliases point into `src/` |
