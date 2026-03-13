# Alpha Pegasi q — Project Structure
**Next.js App Router · Supabase · Clerk · Vercel**

> Reference this document alongside the PRD when making decisions about where new files, components, and logic live. Every directory exists for a reason — that reason is documented below.

---

## Root Directory

```
alpha-pegasi-q/
├── .env.local                        # Local secrets (never committed)
├── .env.example                      # Committed env template (no values)
├── .gitignore
├── next.config.js                    # Next.js config (WebGL, canvas, RPGJS exceptions)
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                     # Clerk auth middleware (route protection)
│
├── public/                           # Static assets (served as-is)
├── supabase/                         # Supabase local dev & migrations
├── src/                              # All application source code
└── docs/                             # PRD, structure doc, agent schema spec
```

---

## `/public` — Static Assets

```
public/
├── fonts/                            # Any self-hosted fonts
├── audio/                            # Ambient biome sounds (Phase 2+)
├── textures/                         # Three.js planet textures (biome maps, cloud layer)
│   ├── planet-heightmap.png
│   ├── planet-biome-map.png          # Color map defining 15 biome regions
│   ├── planet-normal-map.png
│   ├── planet-specular-map.png
│   └── starfield.png
├── sprites/                          # RPGJS pixel art sprite sheets
│   ├── characters/                   # Human avatar sprites
│   ├── agents/                       # Agent NPC sprites (per biome style)
│   ├── tiles/                        # Tileset PNGs (referenced by Tiled maps)
│   └── ui/                           # Pixel art UI elements
├── maps/                             # Tiled .tmx / .json map exports
│   └── arboria/
│       ├── arboria-region.tmj        # Regional overview map
│       └── arboria-market-town.tmj   # First playable settlement
└── icons/                            # Favicon, PWA icons, OG images
```

---

## `/supabase` — Database & Local Dev

```
supabase/
├── config.toml                       # Supabase local dev config
├── seed.sql                          # Initial seed data (biomes, demo agents)
└── migrations/
    ├── 0001_initial_schema.sql       # users, agents, interactions, ledger tables
    ├── 0002_world_state.sql          # world_state, properties, settlements tables
    ├── 0003_rls_policies.sql         # All Row Level Security policies
    └── 0004_functions.sql            # DB functions (reputation calc, rent deduction)
```

---

## `/docs` — Project Knowledge Base

```
docs/
├── alpha-pegasi-q-PRD.md             # Canonical PRD (source of truth)
├── alpha-pegasi-q-PROJECT-STRUCTURE.md  # This document
├── agent-payload-schema.md           # Standard JSON contract for agent APIs
├── biome-design-reference.md         # Visual and architectural notes per biome
└── economy-design.md                 # World Credits, rent, reputation formulae
```

---

## `/src` — Application Source

```
src/
├── app/                              # Next.js App Router (pages & API routes)
├── components/                       # All React components
├── engine/                           # Three.js planet + RPGJS world logic
├── lib/                              # Shared utilities, clients, constants
├── hooks/                            # Custom React hooks
├── stores/                           # Client-side state (Zustand)
├── types/                            # TypeScript type definitions
└── styles/                           # Global CSS
```

---

## `/src/app` — Next.js App Router

This is the routing backbone. Every folder is a route segment.

```
src/app/
│
├── layout.tsx                        # Root layout (ClerkProvider, fonts, globals)
├── page.tsx                          # Landing / marketing page (pre-login)
├── loading.tsx                       # Global loading skeleton
├── error.tsx                         # Global error boundary
│
├── (marketing)/                      # Route group — unauthenticated public pages
│   ├── layout.tsx                    # Marketing layout (nav, footer)
│   ├── about/page.tsx
│   ├── pricing/page.tsx
│   └── terms/page.tsx
│
├── (auth)/                           # Route group — Clerk auth pages
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
│
├── world/                            # The planet & game world (core experience)
│   ├── layout.tsx                    # World layout (no standard nav — fullscreen)
│   ├── page.tsx                      # Orbital view (Three.js planet)
│   │
│   ├── [biome]/                      # Dynamic biome route
│   │   ├── page.tsx                  # 2D regional map for this biome
│   │   └── [settlement]/             # Dynamic settlement route
│   │       ├── page.tsx              # RPGJS first-person settlement view
│   │       └── [agent]/              # Dynamic agent profile route
│   │           └── page.tsx          # Public agent profile page
│
├── dashboard/                        # Authenticated user dashboard
│   ├── layout.tsx                    # Dashboard shell (sidebar nav)
│   ├── page.tsx                      # Overview (credits, agent status, activity)
│   ├── agent/
│   │   ├── register/page.tsx         # Agent registration flow
│   │   └── [id]/
│   │       ├── page.tsx              # Agent management (edit, memory, reputation)
│   │       └── home/page.tsx         # Home customization interface
│   ├── credits/
│   │   ├── page.tsx                  # Credit balance, transaction history
│   │   └── purchase/page.tsx         # Stripe credit purchase flow
│   └── settings/page.tsx             # Account settings, notification prefs
│
├── admin/                            # Platform Governor interface (role-gated)
│   ├── layout.tsx                    # Admin layout with governor auth check
│   ├── page.tsx                      # Admin overview dashboard
│   ├── agents/page.tsx               # Pending approvals, all registered agents
│   ├── economy/page.tsx              # World Credits, ledger, rent parameters
│   ├── world/page.tsx                # World state controls (time, weather overrides)
│   └── users/page.tsx                # User management
│
└── api/                              # Next.js API Route Handlers
    │
    ├── webhooks/
    │   ├── clerk/route.ts            # Clerk webhook (user created → upsert DB)
    │   └── stripe/route.ts           # Stripe webhook (payment → credit ledger)
    │
    ├── agent/
    │   ├── register/route.ts         # POST: submit agent for approval
    │   ├── recommend-biome/route.ts  # POST: capability tags → biome suggestions
    │   └── [id]/
    │       ├── route.ts              # GET/PATCH/DELETE agent record
    │       └── interact/route.ts     # POST: human initiates conversation (gateway)
    │
    ├── world/
    │   ├── state/route.ts            # GET: current world state (time, weather)
    │   └── [biome]/
    │       └── settlements/route.ts  # GET: settlement list + population for biome
    │
    ├── economy/
    │   ├── credits/route.ts          # GET: user balance | POST: create Stripe session
    │   └── ledger/route.ts           # GET: transaction history
    │
    └── cron/
        ├── rent-deduction/route.ts   # POST: Upstash QStash daily rent trigger
        └── world-tick/route.ts       # POST: Upstash QStash world state advance
```

---

## `/src/components` — React Components

Organized by concern. Components are never responsible for data fetching — that lives in hooks or server components.

```
src/components/
│
├── ui/                               # Headless/primitive UI (shadcn + custom)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── ...                           # All shadcn/ui components live here
│
├── layout/                           # App shell components
│   ├── WorldShell.tsx                # Fullscreen wrapper for world views
│   ├── DashboardSidebar.tsx
│   ├── AdminSidebar.tsx
│   └── Breadcrumb.tsx                # Planet > Biome > Settlement trail
│
├── planet/                           # Orbital / Three.js components
│   ├── PlanetCanvas.tsx              # react-three-fiber Canvas root
│   ├── PlanetSphere.tsx              # SphereGeometry + biome shader material
│   ├── BiomeRegions.tsx              # Invisible clickable zones over biome areas
│   ├── AtmosphereGlow.tsx            # Atmospheric haze shader
│   ├── CloudLayer.tsx                # Animated cloud sphere
│   ├── StarField.tsx                 # Background star particles
│   ├── DayNightTerminator.tsx        # Terminator line shader
│   ├── BiomeTooltip.tsx              # Hover label (biome name + description)
│   └── ZoomTransition.tsx            # Camera animation: orbit → regional map
│
├── region/                           # 2D regional map components
│   ├── RegionMap.tsx                 # Root 2D map container
│   ├── RegionTerrain.tsx             # Pixel-art biome terrain canvas
│   ├── SettlementMarker.tsx          # Village / town / city icon on map
│   ├── RegionWeather.tsx             # Weather overlay (rain, mist, snow particles)
│   ├── RegionLighting.tsx            # Day/night overlay on 2D map
│   └── RegionMinimap.tsx             # Minimap for large biome regions
│
├── settlement/                       # RPGJS settlement view components
│   ├── SettlementCanvas.tsx          # RPGJS canvas mount + lifecycle
│   ├── AgentHome.tsx                 # Visual agent home building component
│   ├── AgentStatusIndicator.tsx      # Online/offline/busy dot on home
│   ├── InteractionPrompt.tsx         # "Press E to interact" prompt near agent
│   └── SettlementHUD.tsx             # In-world HUD (time, weather, location)
│
├── chat/                             # Conversation overlay
│   ├── ChatOverlay.tsx               # Full chat interface (blurred world behind)
│   ├── ChatMessages.tsx              # Message list with agent/user attribution
│   ├── ChatInput.tsx                 # Text input + send + voice toggle
│   ├── AgentAvatar.tsx               # Pixel-art agent avatar with state animation
│   ├── AgentThinking.tsx             # Animated thinking indicator
│   ├── InteractionJournal.tsx        # Side panel: past interactions with this agent
│   └── SentimentBadge.tsx            # Visual positive/neutral/negative indicator
│
├── agent/                            # Agent profile & management components
│   ├── AgentCard.tsx                 # Summary card (used in lists, search)
│   ├── AgentProfile.tsx              # Full public profile page layout
│   ├── AgentReputation.tsx           # Reputation score display + breakdown
│   ├── AgentMemoryLog.tsx            # Owner view: interaction memory entries
│   ├── AgentRegistrationForm.tsx     # Multi-step registration wizard
│   ├── BiomeRecommendation.tsx       # Shows 3 recommended biomes with reasoning
│   └── HomeCustomizer.tsx            # Tier-bounded home customization tool
│
├── economy/                          # Economy & credits components
│   ├── CreditBalance.tsx             # WC balance display
│   ├── CreditPurchaseModal.tsx       # Stripe purchase flow modal
│   ├── LedgerTable.tsx               # Transaction history table
│   └── PropertyCard.tsx              # Current home tier, rent due, upgrade option
│
├── admin/                            # Governor admin panel components
│   ├── AgentApprovalQueue.tsx        # Pending agent registrations
│   ├── WorldStateControls.tsx        # Override time/weather/season
│   ├── EconomyControls.tsx           # Adjust rent multipliers, credit rates
│   └── UserTable.tsx                 # User management table
│
└── shared/                           # Truly shared across all contexts
    ├── WorldTime.tsx                 # Live world clock display
    ├── BiomeBadge.tsx                # Colored biome label pill
    ├── LoadingPlanet.tsx             # Branded loading state (spinning planet)
    └── ErrorBoundary.tsx
```

---

## `/src/engine` — Game Engine Logic

Pure logic — no React, no UI. These modules are consumed by components.

```
src/engine/
│
├── planet/
│   ├── biomeShader.glsl              # GLSL fragment shader: biome texture mapping
│   ├── atmosphereShader.glsl         # GLSL: atmospheric scattering effect
│   ├── terminatorShader.glsl         # GLSL: day/night terminator line
│   ├── biomeConfig.ts                # 15 biome definitions (colors, regions, metadata)
│   └── planetTime.ts                 # Server-synced world clock logic
│
├── region/
│   ├── weatherEngine.ts              # Biome weather probability & state machine
│   ├── seasonEngine.ts               # Season calculation per biome
│   └── mapLoader.ts                  # Tiled .tmj → canvas renderer bridge
│
├── settlement/
│   ├── rpgjsConfig.ts                # RPGJS initialization + plugin config
│   ├── rpgjsControls.ts              # WASD camera + movement bindings
│   ├── npcManager.ts                 # NPC (agent) placement, interaction zones
│   └── settlementEvents.ts           # In-world events (weather change, new agent)
│
└── agent/
    ├── agentGateway.ts               # Core: context assembly + OpenRouter call
    ├── contextBuilder.ts             # Builds prompt context from world state + memory
    ├── sentimentClassifier.ts        # LLM-based or rule-based sentiment scoring
    ├── memoryManager.ts              # Read/write interaction memory to Supabase
    └── biomeRecommender.ts           # Capability tags → biome score algorithm
```

---

## `/src/lib` — Shared Utilities & Clients

Instantiated once, imported everywhere.

```
src/lib/
│
├── supabase/
│   ├── client.ts                     # Browser Supabase client (with Clerk JWT)
│   ├── server.ts                     # Server-side Supabase client (service role)
│   └── realtime.ts                   # Supabase Realtime channel subscriptions
│
├── clerk/
│   └── helpers.ts                    # getCurrentUser, requireSteward, requireAdmin
│
├── stripe/
│   ├── client.ts                     # Stripe SDK instance
│   └── prices.ts                     # Price IDs for subscriptions + credit tiers
│
├── openrouter/
│   ├── client.ts                     # OpenRouter fetch wrapper
│   └── models.ts                     # Model IDs and fallback chain
│
├── upstash/
│   ├── redis.ts                       # Upstash Redis client
│   └── qstash.ts                      # QStash publisher (cron job triggers)
│
├── resend/
│   └── client.ts                      # Resend email client
│
├── posthog/
│   └── client.ts                      # PostHog analytics client
│
├── constants/
│   ├── biomes.ts                      # BIOMES array: id, name, description, coords
│   ├── economy.ts                     # BASE_RENT, TIER_COSTS, REPUTATION_THRESHOLDS
│   └── world.ts                       # DAY_CYCLE_MINUTES, WEATHER_TICK_INTERVAL
│
└── utils/
    ├── cn.ts                          # Tailwind class merge utility
    ├── formatCredits.ts               # WC display formatting
    ├── worldTime.ts                   # Convert server epoch → world time string
    └── slugify.ts                     # agent name → URL slug
```

---

## `/src/hooks` — Custom React Hooks

```
src/hooks/
├── useWorldState.ts                  # Subscribes to Supabase Realtime world state
├── useAgentStatus.ts                 # Live agent online/offline status
├── useSettlementPopulation.ts        # Live population count for a settlement
├── useInteractionHistory.ts          # Fetch + cache user's past interactions
├── useCreditBalance.ts               # User's WC balance (with optimistic updates)
├── useWorldTime.ts                   # Synced world clock with server time
└── useBiomeWeather.ts                # Current weather for a given biome
```

---

## `/src/stores` — Client State (Zustand)

```
src/stores/
├── worldStore.ts                     # Active biome, settlement, zoom level, time
├── chatStore.ts                      # Active conversation: agent, messages, loading
├── playerStore.ts                    # Player position, facing direction, inventory
└── uiStore.ts                        # Modal states, sidebar open, HUD visibility
```

---

## `/src/types` — TypeScript Definitions

```
src/types/
├── agent.ts                          # Agent, AgentStatus, AgentCapability types
├── biome.ts                          # Biome, Settlement, SettlementScale types
├── economy.ts                        # WorldCredit, LedgerEntry, PropertyTier types
├── interaction.ts                    # Interaction, Message, Sentiment types
├── user.ts                           # User, AccountTier types
├── world.ts                          # WorldState, WeatherType, Season types
└── api.ts                            # API request/response payload types
```

---

## `/src/styles`

```
src/styles/
├── globals.css                       # Tailwind directives + CSS custom properties
├── rpgjs-overrides.css               # Override RPGJS default canvas styling
└── pixel-fonts.css                   # @font-face for any pixel-art fonts
```

---

## `/middleware.ts` — Clerk Route Protection

```typescript
// Routes that require auth:
// /dashboard/*  → requires Explorer or Steward
// /admin/*      → requires Governor role
// /world/*      → public (Visitor access)
// /api/agent/*  → requires Steward for write operations
// /api/cron/*   → requires Upstash QStash signature header
```

---

## Key Architectural Rules

These rules keep the project coherent as it grows. Every contributor should know them.

### 1. Data fetching lives in Server Components or hooks — never in UI components
`AgentCard.tsx` renders data. It does not fetch it. Data arrives as props from a Server Component or via a custom hook.

### 2. All agent API calls are server-side only
The `/api/agent/[id]/interact/route.ts` handler is the only place that calls an agent's registered API endpoint. No agent endpoint is ever called from the browser. This protects API keys and enforces the logging/memory pipeline.

### 3. Supabase access is always role-aware
Browser code uses the Clerk-JWT-injected client (`lib/supabase/client.ts`). Server code (API routes, Server Components) uses the service-role client (`lib/supabase/server.ts`). Never use the service-role client in browser-accessible code.

### 4. Engine code has no React dependencies
Everything in `/src/engine` is framework-agnostic TypeScript. This makes it testable and portable. If RPG.js is ever replaced, only `/src/engine/settlement` needs to change.

### 5. GLSL shaders live in `/src/engine/planet` — not in components
`PlanetSphere.tsx` imports the shader strings. It does not define them. This keeps visual logic auditable and reusable.

### 6. Constants are the single source of truth
Biome IDs used in the database, the 3D engine, the API routes, and the UI all reference the same `BIOMES` array from `lib/constants/biomes.ts`. Never hardcode a biome name or ID in component code.

### 7. The `/admin` route is role-gated at the middleware level
Do not rely on UI-level hiding for admin features. The middleware must check governor role before rendering any admin route.

---

## Environment Variables

```bash
# .env.example — copy to .env.local and fill in values

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STEWARD_PRICE_ID=

# OpenRouter
OPENROUTER_API_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Resend
RESEND_API_KEY=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOVERNOR_USER_ID=                      # Clerk user ID of the platform governor
```

---

## Phase-by-Phase File Creation Order

When building, create files in this order to avoid dependency gaps:

**Phase 0**
`tsconfig.json` → `tailwind.config.ts` → `src/types/*` → `src/lib/supabase/*` → `src/lib/clerk/*` → `supabase/migrations/0001–0004` → `middleware.ts` → `src/app/layout.tsx` → `src/app/(auth)/*`

**Phase 1**
`src/lib/constants/biomes.ts` → `public/textures/*` → `src/engine/planet/*` → `src/components/planet/*` → `src/app/world/page.tsx`

**Phase 2**
`public/maps/arboria/*` → `src/engine/region/*` → `src/engine/settlement/*` → `src/components/region/*` → `src/components/settlement/*` → `src/app/world/[biome]/page.tsx` → `src/app/world/[biome]/[settlement]/page.tsx`

**Phase 3**
`src/engine/agent/*` → `src/lib/openrouter/*` → `src/app/api/agent/[id]/interact/route.ts` → `src/components/chat/*` → `src/hooks/useInteractionHistory.ts`

**Phase 4**
`src/lib/stripe/*` → `src/app/api/webhooks/stripe/route.ts` → `src/app/api/economy/*` → `src/lib/upstash/*` → `src/app/api/cron/*` → `src/components/agent/AgentRegistrationForm.tsx` → `src/engine/agent/biomeRecommender.ts` → `src/app/dashboard/*`

**Phase 5**
`src/app/admin/*` → `src/components/admin/*` → performance profiling → mobile CSS pass

---

*— End of Document —*

*Alpha Pegasi q · Project Structure v1.0 · March 2026*
