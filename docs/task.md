# Alpha Pegasi q - MVP Execution Roadmap

This document breaks down the actionable tasks for building the Alpha Pegasi q MVP. It aligns exactly with the 6 MVP Build Phases (Phase 0 -> Phase 5) defined in the canonical Product Requirements Document.

## Phase 0: Foundation
*Project scaffolding. Next.js setup. Database schema. Authentication. Deployment.*
- [x] Initialize Next.js project structure with TailwindCSS
- [x] Integrate Clerk for authentication (Visitor, Explorer, Steward tiers)
- [x] Set up Supabase PostgreSQL Project
- [x] Define DB Schemas (users, agents, interactions, world_credit_ledger)
- [x] Configure Clerk-Supabase JWT integration for Row Level Security (RLS)
- [x] Setup initial Vercel deployment pipeline

## Phase 1: The Planet
*3D rotating sphere. 15 biome regions visible. Day/night cycle. Zoom transition.*
- [x] Set up generic 3D canvas with React Three Fiber
- [x] Render high-fidelity 3D rotating sphere with star field background
- [x] Write GLSL shaders to render 15 distinct biome regions
- [x] Implement global day/night terminator line synced to real-time clock
- [x] Build seamless zoom interaction from 3D Orbital to 2D Regional bounds

## Phase 2: Arboria
*2D pixel-art regional map. First-person WASD settlement. Weather. Three demo agents.*
- [ ] Integrate RPG JS engine into the Next.js shell
- [ ] Use Tiled editor to design the Arboria layout, tiles, and collision maps
- [ ] Load the Tiled map into RPG JS and enable WASD player controls
- [ ] Connect Supabase Realtime to broadcast biome weather/lighting to engine
- [ ] Place the 3 static demo NPCs in the Arboria settlement map

## Phase 3: Agent Interaction
*Text conversation with agents. Interaction memory. Sentiment classification.*
- [ ] Build the Chat UI overlay over the game canvas
- [ ] Architect the `Agent Communication Protocol` serverless API Gateway
- [ ] Set up OpenRouter API integration
- [ ] Build prompt hydration (injecting weather, time, and user memory from DB)
- [ ] Save message history and sentiment classifications automatically to Supabase
- [ ] Implement basic online/busy status indicators for agents

## Phase 4: Economy & Accounts
*Stripe integration. World Credits. Steward accounts. Agent registration.*
- [ ] Build Agent Registration UI forms and logic (with biome recommendation)
- [ ] Integrate Stripe checkout for Steward subscription and World Credits (WC)
- [ ] Wire Stripe webhooks to the Supabase `world_credit_ledger`
- [ ] Build Upstash QStash cron jobs to process daily/monthly automated rent deductions
- [ ] Create Agent Profile URLs (e.g., /arboria/town/agent-name)

## Phase 5: Polish & Launch
*Performance optimization. Mobile responsiveness. Admin panel.*
- [ ] Conduct rigorous WebGL/RPGJS frame rate profiling and chunking
- [ ] Implement mobile-responsive UI fallbacks and generic touch controls
- [ ] Finalize the secure Platform Governor Admin Panel (for manually approving initial agents)
- [ ] Perform security audits on Supabase RLS and Agent Gateway API routes
