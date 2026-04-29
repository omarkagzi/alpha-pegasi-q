# Landing Page Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the standalone `Landing Page/` Next.js project into the main `Project_Alpha_Pegasi_q` codebase so that the root URL (`/`) renders the landing page and everything is committed to one repo.

**Architecture:** Copy all landing page components and assets into the main project's `src/` tree, merge the CSS design tokens and layout config, replace the current `src/app/page.tsx` redirect with the landing page content, then delete the nested `Landing Page/` directory. The shadcn/ui component library from the landing page becomes the UI foundation under `src/components/ui/`.

**Tech Stack:** Next.js 16 (App Router, `src/` layout), Tailwind CSS v4, shadcn/ui, framer-motion, gsap, lenis, IBM Plex Sans / Bebas Neue fonts.

---

## Key Facts for Implementers

- Main project `@/*` alias resolves to `./src/*` — so `@/components/ui/button` → `src/components/ui/button.tsx`.
- Landing Page `@/*` resolved to its own root — but after copying into `src/`, all internal `@/` imports will resolve correctly without changes.
- The landing page has its own `.git` folder — it must be deleted along with the directory after copying.
- The current `src/app/page.tsx` just redirects to `/world`. It will be replaced entirely.
- The main `src/app/layout.tsx` wraps with Clerk + PostHog — these must stay. The landing page's layout contributes: fonts, `dark` class on `<html>`, SmoothScroll wrapper, noise overlay div.

---

## File Map

### New files to CREATE
| Destination | Source |
|---|---|
| `src/components/landing/hero-section.tsx` | `Landing Page/components/hero-section.tsx` |
| `src/components/landing/work-section.tsx` | `Landing Page/components/work-section.tsx` |
| `src/components/landing/principles-section.tsx` | `Landing Page/components/principles-section.tsx` |
| `src/components/landing/colophon-section.tsx` | `Landing Page/components/colophon-section.tsx` |
| `src/components/landing/side-nav.tsx` | `Landing Page/components/side-nav.tsx` |
| `src/components/landing/animated-noise.tsx` | `Landing Page/components/animated-noise.tsx` |
| `src/components/landing/bitmap-chevron.tsx` | `Landing Page/components/bitmap-chevron.tsx` |
| `src/components/landing/draw-text.tsx` | `Landing Page/components/draw-text.tsx` |
| `src/components/landing/highlight-text.tsx` | `Landing Page/components/highlight-text.tsx` |
| `src/components/landing/scramble-text.tsx` | `Landing Page/components/scramble-text.tsx` |
| `src/components/landing/split-flap-text.tsx` | `Landing Page/components/split-flap-text.tsx` |
| `src/components/landing/smooth-scroll.tsx` | `Landing Page/components/smooth-scroll.tsx` |
| `src/components/landing/signals-section.tsx` | `Landing Page/components/signals-section.tsx` |
| `src/components/landing/theme-provider.tsx` | `Landing Page/components/theme-provider.tsx` |
| `src/components/ui/` (all files) | `Landing Page/components/ui/` |
| `src/lib/utils.ts` | `Landing Page/lib/utils.ts` |
| `src/hooks/use-mobile.ts` | `Landing Page/hooks/use-mobile.ts` |
| `src/hooks/use-toast.ts` | `Landing Page/hooks/use-toast.ts` |
| `public/icon-light-32x32.png` | `Landing Page/public/icon-light-32x32.png` |
| `public/icon-dark-32x32.png` | `Landing Page/public/icon-dark-32x32.png` |
| `public/icon.svg` | `Landing Page/public/icon.svg` |
| `public/apple-icon.png` | `Landing Page/public/apple-icon.png` |
| `components.json` | `Landing Page/components.json` (update paths to `src/`) |

### Files to MODIFY
| File | What changes |
|---|---|
| `package.json` | Add all landing page dependencies not already present |
| `src/app/globals.css` | Merge landing page CSS tokens (design tokens, noise overlay, grid-bg, scrollbar, selection) |
| `src/app/layout.tsx` | Add IBM Plex + Bebas fonts, `dark` class on `<html>`, SmoothScroll wrapper, noise overlay div |
| `src/app/page.tsx` | Replace redirect with landing page sections |

### Files to DELETE
- `Landing Page/` (entire directory including nested `.git`)

---

## Chunk 1: Dependencies and CSS Foundation

### Task 1: Add missing dependencies to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add all missing dependencies**

Open `package.json` and add the following to `"dependencies"`:

```json
"@emotion/is-prop-valid": "latest",
"@hookform/resolvers": "^3.10.0",
"@radix-ui/react-accordion": "1.2.2",
"@radix-ui/react-alert-dialog": "1.1.4",
"@radix-ui/react-aspect-ratio": "1.1.1",
"@radix-ui/react-avatar": "1.1.2",
"@radix-ui/react-checkbox": "1.1.3",
"@radix-ui/react-collapsible": "1.1.2",
"@radix-ui/react-context-menu": "2.2.4",
"@radix-ui/react-dialog": "1.1.4",
"@radix-ui/react-dropdown-menu": "2.1.4",
"@radix-ui/react-hover-card": "1.1.4",
"@radix-ui/react-label": "2.1.1",
"@radix-ui/react-menubar": "1.1.4",
"@radix-ui/react-navigation-menu": "1.2.3",
"@radix-ui/react-popover": "1.1.4",
"@radix-ui/react-progress": "1.1.1",
"@radix-ui/react-radio-group": "1.2.2",
"@radix-ui/react-scroll-area": "1.2.2",
"@radix-ui/react-select": "2.1.4",
"@radix-ui/react-separator": "1.1.1",
"@radix-ui/react-slider": "1.2.2",
"@radix-ui/react-slot": "1.1.1",
"@radix-ui/react-switch": "1.1.2",
"@radix-ui/react-tabs": "1.1.2",
"@radix-ui/react-toast": "1.2.4",
"@radix-ui/react-toggle": "1.1.1",
"@radix-ui/react-toggle-group": "1.1.1",
"@radix-ui/react-tooltip": "1.1.6",
"@vercel/analytics": "1.3.1",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"cmdk": "1.0.4",
"date-fns": "4.1.0",
"embla-carousel-react": "8.5.1",
"framer-motion": "12.23.26",
"gsap": "3.14.1",
"input-otp": "1.4.1",
"lenis": "1.3.15",
"lucide-react": "^0.454.0",
"next-themes": "^0.4.6",
"react-day-picker": "9.8.0",
"react-hook-form": "^7.60.0",
"react-resizable-panels": "^2.1.7",
"recharts": "2.15.4",
"sonner": "^1.7.4",
"tailwind-merge": "^3.3.1",
"tailwindcss-animate": "^1.0.7",
"vaul": "^1.1.2",
"zod": "3.25.76"
```

Add to `"devDependencies"`:
```json
"tw-animate-css": "1.3.3"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: Clean install, no peer dependency errors. If React version conflicts appear on Radix packages, add `--legacy-peer-deps`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add shadcn/ui and landing page dependencies"
```

---

### Task 2: Merge CSS design tokens into globals.css

**Files:**
- Modify: `src/app/globals.css`

The landing page's CSS (`Landing Page/app/globals.css`) has:
- Custom dark design tokens (monochrome + orange accent)
- `@import "tw-animate-css"`
- `@custom-variant dark (&:is(.dark *))`
- `.noise-overlay`, `.grid-bg`, `::selection`, scrollbar styles

The main project's `globals.css` has Geist font vars and game-specific animations.

Both need to coexist. The landing page tokens only apply at the root (`/`) but since CSS is global we add them safely — they don't conflict with game styles.

- [ ] **Step 1: Add tw-animate-css import and dark variant to globals.css**

After the existing `@import "tailwindcss";` line, add:

```css
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 2: Add landing page design tokens**

Append the following to `src/app/globals.css`:

```css
/* ── Landing Page Design Tokens ── */
:root {
  --lp-background: oklch(0.08 0 0);
  --lp-foreground: oklch(0.95 0 0);
  --lp-card: oklch(0.12 0 0);
  --lp-card-foreground: oklch(0.95 0 0);
  --lp-popover: oklch(0.1 0 0);
  --lp-popover-foreground: oklch(0.95 0 0);
  --lp-primary: oklch(0.95 0 0);
  --lp-primary-foreground: oklch(0.08 0 0);
  --lp-secondary: oklch(0.18 0 0);
  --lp-secondary-foreground: oklch(0.85 0 0);
  --lp-muted: oklch(0.25 0 0);
  --lp-muted-foreground: oklch(0.55 0 0);
  --lp-accent: oklch(0.7 0.2 45);
  --lp-accent-foreground: oklch(0.08 0 0);
  --lp-destructive: oklch(0.577 0.245 27.325);
  --lp-border: oklch(0.25 0 0);
  --lp-input: oklch(0.2 0 0);
  --lp-ring: oklch(0.7 0.2 45);
  --lp-radius: 0rem;
}

@theme inline {
  --font-display: "Bebas Neue", "Bebas Neue Fallback", sans-serif;
  --color-lp-background: var(--lp-background);
  --color-lp-foreground: var(--lp-foreground);
  --color-lp-accent: var(--lp-accent);
  --color-lp-border: var(--lp-border);
  --color-lp-muted: var(--lp-muted);
  --color-lp-muted-foreground: var(--lp-muted-foreground);
}

/* Noise texture overlay (landing page) */
.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* Grid background (landing page) */
.grid-bg {
  background-image: linear-gradient(to right, oklch(0.2 0 0) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.2 0 0) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* Custom selection */
::selection {
  background: oklch(0.7 0.2 45);
  color: oklch(0.08 0 0);
}
```

> **Note on CSS tokens:** The landing page uses direct CSS variable names like `--background`, `--foreground` etc. But the main project also uses those same names with different values (white background). To avoid conflicts, the landing page tokens are prefixed with `--lp-`. In Task 7, when updating `src/app/page.tsx` and the landing components, verify whether any component explicitly references un-prefixed CSS vars that would clash, and patch them as needed. Shadcn UI components inside `src/components/ui/` use the un-prefixed names — those will need the full token set. See the note in Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: merge landing page CSS tokens into globals"
```

---

## Chunk 2: Copy Components and Assets

### Task 3: Copy shadcn/ui components

**Files:**
- Create: `src/components/ui/` (entire directory)

- [ ] **Step 1: Copy all UI component files**

```bash
cp -r "Landing Page/components/ui/." src/components/ui/
```

- [ ] **Step 2: Verify copy**

```bash
ls src/components/ui/ | wc -l
```

Expected: ~50 files.

- [ ] **Step 3: Copy components.json and update paths**

```bash
cp "Landing Page/components.json" components.json
```

Then open `components.json` and update:
- `"aliases.utils"` → `"@/lib/utils"`
- `"aliases.components"` → `"@/components/ui"`
- `"aliases.hooks"` → `"@/hooks"`
- `"aliases.lib"` → `"@/lib"`

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ components.json
git commit -m "feat: add shadcn/ui component library"
```

---

### Task 4: Copy lib/utils and hooks

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/hooks/use-mobile.ts`
- Create: `src/hooks/use-toast.ts`

- [ ] **Step 1: Copy utils**

```bash
cp "Landing Page/lib/utils.ts" src/lib/utils.ts
```

- [ ] **Step 2: Copy hooks**

```bash
cp "Landing Page/hooks/use-mobile.ts" src/hooks/use-mobile.ts
cp "Landing Page/hooks/use-toast.ts" src/hooks/use-toast.ts
```

- [ ] **Step 3: Verify files exist and look correct**

```bash
cat src/lib/utils.ts
```

Expected: exports a `cn` function using `clsx` and `tailwind-merge`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/hooks/
git commit -m "feat: add cn utility and landing page hooks"
```

---

### Task 5: Copy landing page section components

**Files:**
- Create: `src/components/landing/` (all section files)

- [ ] **Step 1: Copy all landing section components**

```bash
cp "Landing Page/components/hero-section.tsx" src/components/landing/hero-section.tsx
cp "Landing Page/components/work-section.tsx" src/components/landing/work-section.tsx
cp "Landing Page/components/principles-section.tsx" src/components/landing/principles-section.tsx
cp "Landing Page/components/colophon-section.tsx" src/components/landing/colophon-section.tsx
cp "Landing Page/components/side-nav.tsx" src/components/landing/side-nav.tsx
cp "Landing Page/components/animated-noise.tsx" src/components/landing/animated-noise.tsx
cp "Landing Page/components/bitmap-chevron.tsx" src/components/landing/bitmap-chevron.tsx
cp "Landing Page/components/draw-text.tsx" src/components/landing/draw-text.tsx
cp "Landing Page/components/highlight-text.tsx" src/components/landing/highlight-text.tsx
cp "Landing Page/components/scramble-text.tsx" src/components/landing/scramble-text.tsx
cp "Landing Page/components/split-flap-text.tsx" src/components/landing/split-flap-text.tsx
cp "Landing Page/components/smooth-scroll.tsx" src/components/landing/smooth-scroll.tsx
cp "Landing Page/components/signals-section.tsx" src/components/landing/signals-section.tsx
cp "Landing Page/components/theme-provider.tsx" src/components/landing/theme-provider.tsx
```

- [ ] **Step 2: Verify all files copied**

```bash
ls src/components/landing/
```

Expected: 14 files listed.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/
git commit -m "feat: add landing page section components"
```

---

### Task 6: Resolve CSS token conflict in shadcn components

**Context:** The shadcn/ui components in `src/components/ui/` expect CSS variables like `--background`, `--foreground`, `--primary`, etc. The main project's `src/app/globals.css` already defines these pointing to the game's color scheme. The landing page defines them with its own dark monochrome values in `Landing Page/app/globals.css`.

**Strategy:** Add a `.landing-page` CSS scope class that overrides those tokens for the landing page subtree. Then wrap the landing page's `<main>` in `<div className="landing-page">`.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add landing page token scope to globals.css**

Append to `src/app/globals.css`:

```css
/* Token overrides scoped to landing page — prevents clashing with game/auth styles */
.landing-page {
  --background: oklch(0.08 0 0);
  --foreground: oklch(0.95 0 0);
  --card: oklch(0.12 0 0);
  --card-foreground: oklch(0.95 0 0);
  --popover: oklch(0.1 0 0);
  --popover-foreground: oklch(0.95 0 0);
  --primary: oklch(0.95 0 0);
  --primary-foreground: oklch(0.08 0 0);
  --secondary: oklch(0.18 0 0);
  --secondary-foreground: oklch(0.85 0 0);
  --muted: oklch(0.25 0 0);
  --muted-foreground: oklch(0.55 0 0);
  --accent: oklch(0.7 0.2 45);
  --accent-foreground: oklch(0.08 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.25 0 0);
  --input: oklch(0.2 0 0);
  --ring: oklch(0.7 0.2 45);
  --radius: 0rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add scoped CSS token override for landing page"
```

---

### Task 7: Copy public assets

**Files:**
- Create: `public/icon-light-32x32.png`, `public/icon-dark-32x32.png`, `public/icon.svg`, `public/apple-icon.png`

- [ ] **Step 1: Copy icons**

```bash
cp "Landing Page/public/icon-light-32x32.png" public/icon-light-32x32.png
cp "Landing Page/public/icon-dark-32x32.png" public/icon-dark-32x32.png
cp "Landing Page/public/icon.svg" public/icon.svg
cp "Landing Page/public/apple-icon.png" public/apple-icon.png
```

- [ ] **Step 2: Commit**

```bash
git add public/
git commit -m "feat: add landing page icons to public assets"
```

---

## Chunk 3: Wire Up Root Route

### Task 8: Update root layout to support landing page

**Files:**
- Modify: `src/app/layout.tsx`

The current layout uses Geist fonts. The landing page requires IBM Plex Sans, IBM Plex Mono, and Bebas Neue. We keep both font sets — Geist stays for the game/app, IBM Plex + Bebas serve the landing page via CSS variables. We also add the `dark` class to `<html>` (the game is dark-themed too, so this is safe) and the noise overlay div.

- [ ] **Step 1: Add landing page fonts to layout.tsx**

Add font imports after the existing Geist imports:

```tsx
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
})
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
})
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
})
```

- [ ] **Step 2: Apply font variables and dark class to html/body**

Update the `<html>` element to:
```tsx
<html lang="en" className="dark">
```

Update the `<body>` className to include the new font variables:
```tsx
className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${bebasNeue.variable} antialiased`}
```

- [ ] **Step 3: Add noise overlay div inside body**

Inside `<body>`, before `<PostHogProvider>`, add:
```tsx
<div className="noise-overlay" aria-hidden="true" />
```

- [ ] **Step 4: Verify layout.tsx looks correct**

The final layout should have: ClerkProvider > html.dark > body (all font vars) > noise-overlay div > PostHogProvider > children + CookieConsent.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add landing page fonts and noise overlay to root layout"
```

---

### Task 9: Replace root page.tsx with landing page content

**Files:**
- Modify: `src/app/page.tsx`

The current file just redirects to `/world`. Replace it entirely with the landing page content, importing from `src/components/landing/`.

- [ ] **Step 1: Replace src/app/page.tsx**

```tsx
import { HeroSection } from "@/components/landing/hero-section"
import { WorkSection } from "@/components/landing/work-section"
import { PrinciplesSection } from "@/components/landing/principles-section"
import { ColophonSection } from "@/components/landing/colophon-section"
import { SideNav } from "@/components/landing/side-nav"

export default function Home() {
  return (
    <div className="landing-page">
      <main className="relative min-h-screen bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)]">
        <SideNav />
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10">
          <HeroSection />
          <WorkSection />
          <PrinciplesSection />
          <ColophonSection />
        </div>
      </main>
    </div>
  )
}
```

> Note: The `landing-page` wrapper div activates the scoped CSS token overrides from Task 6. The inline `bg-` and `text-` colors are fallbacks in case token scoping has gaps.

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace root redirect with landing page"
```

---

## Chunk 4: Verify Build and Cleanup

### Task 10: Fix TypeScript errors if any

**Files:**
- Modify: any files with TS errors

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -60
```

Expected: Zero errors. If errors appear they are most likely:
- Missing `"use client"` directive on client components (framer-motion, gsap, lenis all require client)
- Import path issues if any component used a path that doesn't exist in `src/`

- [ ] **Step 2: Fix any TS errors found**

For `"use client"` errors: add `"use client"` as the first line of the offending component file.

For import path errors: update the import to use the correct `@/components/landing/` or `@/components/ui/` prefix.

- [ ] **Step 3: Commit fixes (if any)**

```bash
git add -p
git commit -m "fix: resolve TypeScript errors from landing page integration"
```

---

### Task 11: Run dev server and visually verify landing page

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: Starts on port 3000 with no build errors.

- [ ] **Step 2: Check root URL renders landing page**

Open `http://localhost:3000` — should show the landing page (hero section, side nav, dark monochrome design) NOT redirect to `/world`.

- [ ] **Step 3: Check /world still works**

Open `http://localhost:3000/world` — should still load the game world.

- [ ] **Step 4: Check auth routes still work**

Open `http://localhost:3000/sign-in` — should still load Clerk sign-in.

- [ ] **Step 5: Stop dev server, commit confirmation note**

```bash
git commit --allow-empty -m "chore: verified landing page renders at root, game and auth unaffected"
```

---

### Task 12: Delete the Landing Page directory and finalize

- [ ] **Step 1: Remove the Landing Page directory**

```bash
rm -rf "Landing Page"
```

- [ ] **Step 2: Verify it's gone**

```bash
ls | grep "Landing"
```

Expected: no output.

- [ ] **Step 3: Verify git status is clean except for the deletion**

```bash
git status
```

Expected: `Landing Page/` shows as deleted (untracked directory removed from working tree — since it was never tracked, `git status` should show nothing for it after removal).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: remove standalone Landing Page directory — fully integrated into main codebase"
```

---

## Done

After Task 12, the landing page is fully integrated:
- `/` renders the landing page
- `/world` still loads the game
- `/sign-in`, `/sign-up`, `/privacy`, `/terms` all unaffected
- Single repo, single `package.json`, single git history
