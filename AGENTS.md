# Agent Instructions — Don't Touch Purple

Reflex-based grid-tapping game. React 19, TypeScript 5, Vite 7, Firebase, OGL/WebGL backgrounds.

## Quick Reference

| Area | Location | Key File |
|------|----------|----------|
| Game logic | `engine/` | `engine/GameEngine.ts` |
| Tick processing | `engine/subsystems/` | `TickProcessor.ts` |
| React UI | `components/` | `App.tsx` (main orchestrator) |
| HUD | `components/HUD/` | `PlayerPanel.tsx`, `GameArea.tsx` |
| Backgrounds | `components/Backgrounds/` | 12 OGL themes |
| Config | `src/config/` | `game.ts` (balance, difficulty) |
| Firebase | `services/` | `firebase.ts`, `firestoreService.ts` |
| Workers | `workers/` | `scoreWorker.ts` (Cloudflare) |
| E2E | `e2e/` | `smoke.spec.ts` (Playwright) |
| Design | `DESIGN.md` | MD3 tokens, dark-cyberpunk palette |

## Rules

1. **Pure game logic** in `engine/` — zero React imports
2. **Cell arrays replaced each tick** — never mutate in place
3. **sessionStorage** for game state (not localStorage)
4. **Generation counter** for callbacks referencing cell indices
5. **data-testid** on all key interactive elements
6. **CSS vars from DESIGN.md** — no hardcoded hex colors
7. **RAF idle skip** — check `document.hidden`, skip render when no active entities
8. **WebGL context loss handlers** on all OGL backgrounds
9. **React.memo** for external library components in expensive contexts
10. **safeSet** wrapper for localStorage writes that grow (quota handling)

## Commands

```bash
pnpm dev          # Dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
```

## Architecture

```
App.tsx (state machine)
  ├── engine/ (pure logic, no React)
  ├── components/ (React UI)
  ├── hooks/ (useGameEngine bridge)
  ├── services/ (Firebase, analytics)
  ├── workers/ (Cloudflare proxy)
  └── config/ (balance, patterns, difficulty)
```

## Domain-Specific Agents

| Agent | Scope | Model |
|-------|-------|-------|
| [game-engine](docs/agents/game-engine.md) | GameEngine, TickProcessor, CellLifecycle, boss events, RNG | sonnet |
| [ui-components](docs/agents/ui-components.md) | React UI, screens, HUD, backgrounds, cells | sonnet |
| [firebase-services](docs/agents/firebase-services.md) | Firestore, Auth, Analytics, App Check, Hosting | sonnet |
| [config-balance](docs/agents/config-balance.md) | Game balance, difficulty scaling, grid patterns, powerup weights | sonnet |
| [security-audit](docs/agents/security-audit.md) | Firebase rules, CSP, XSS, state tampering, input validation | sonnet |
| [performance](docs/agents/performance.md) | Core Web Vitals, bundle size, GPU, memory leaks, render perf | sonnet |
| [hooks-state](docs/agents/hooks-state.md) | useGameEngine bridge, custom hooks, contexts, state machines | sonnet |

## Full docs

- **[HANDOFF.md](HANDOFF.md)** — **READ THIS FIRST** in any new session. Master handoff with full project state, what's done, and what's next.
- [llms.txt](llms.txt) — AI agent project overview
- [DESIGN.md](DESIGN.md) — Design tokens and palette
- [CLAUDE.md](CLAUDE.md) — Detailed project instructions
- [docs/agents/](docs/agents/) — Domain-specific agent definitions

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>accessibility</name>
<description>Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible".</description>
<location>project</location>
</skill>

<skill>
<name>best-practices</name>
<description>Apply modern web development best practices for security, compatibility, and code quality. Use when asked to "apply best practices", "security audit", "modernize code", "code quality review", or "check for vulnerabilities".</description>
<location>project</location>
</skill>

<skill>
<name>composition-patterns</name>
<description>React composition patterns that scale. Use when refactoring components with</description>
<location>project</location>
</skill>

<skill>
<name>core-web-vitals</name>
<description>Optimize Core Web Vitals (LCP, INP, CLS) for better page experience and search ranking. Use when asked to "improve Core Web Vitals", "fix LCP", "reduce CLS", "optimize INP", "page experience optimization", or "fix layout shifts".</description>
<location>project</location>
</skill>

<skill>
<name>deploy-to-vercel</name>
<description>Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment".</description>
<location>project</location>
</skill>

<skill>
<name>performance</name>
<description>Optimize web performance for faster loading and better user experience. Use when asked to "speed up my site", "optimize performance", "reduce load time", "fix slow loading", "improve page speed", or "performance audit".</description>
<location>project</location>
</skill>

<skill>
<name>react-best-practices</name>
<description>React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.</description>
<location>project</location>
</skill>

<skill>
<name>react-native-skills</name>
<description>React Native and Expo best practices for building performant mobile apps. Use</description>
<location>project</location>
</skill>

<skill>
<name>react-view-transitions</name>
<description>Guide for implementing smooth, native-feeling animations using React's View Transition API (`<ViewTransition>` component, `addTransitionType`, and CSS view transition pseudo-elements). Use this skill whenever the user wants to add page transitions, animate route changes, create shared element animations, animate enter/exit of components, animate list reorder, implement directional (forward/back) navigation animations, or integrate view transitions in Next.js. Also use when the user mentions view transitions, `startViewTransition`, `ViewTransition`, transition types, or asks about animating between UI states in React without third-party animation libraries.</description>
<location>project</location>
</skill>

<skill>
<name>seo</name>
<description>Optimize for search engine visibility and ranking. Use when asked to "improve SEO", "optimize for search", "fix meta tags", "add structured data", "sitemap optimization", or "search engine optimization".</description>
<location>project</location>
</skill>

<skill>
<name>vercel-cli-with-tokens</name>
<description>Deploy and manage projects on Vercel using token-based authentication. Use when working with Vercel CLI using access tokens rather than interactive login — e.g. "deploy to vercel", "set up vercel", "add environment variables to vercel".</description>
<location>project</location>
</skill>

<skill>
<name>vercel-optimize</name>
<description>"Use for Vercel cost and performance optimization on deployed projects, especially Next.js, SvelteKit, Nuxt, and limited Astro apps. Collect Vercel metrics, usage, project config, and code scan results first; investigate only metric-backed candidates; produce ranked recommendations grounded in verified files and version-aware Vercel/framework docs. Trigger for Vercel bill reduction, slow or expensive routes, caching opportunities, Function Invocations, Build Minutes, Fast Data Transfer, Core Web Vitals, Bot Management, Fluid compute, or cost breakdown requests."</description>
<location>project</location>
</skill>

<skill>
<name>web-design-guidelines</name>
<description>Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".</description>
<location>project</location>
</skill>

<skill>
<name>web-quality-audit</name>
<description>Comprehensive web quality audit covering performance, accessibility, SEO, and best practices. Use when asked to "audit my site", "review web quality", "run lighthouse audit", "check page quality", or "optimize my website".</description>
<location>project</location>
</skill>

<skill>
<name>bash-defensive-patterns</name>
<description>Master defensive Bash programming techniques for production-grade scripts. Use when writing robust shell scripts, CI/CD pipelines, or system utilities requiring fault tolerance and safety.</description>
<location>project</location>
</skill>

<skill>
<name>cloudflare</name>
<description>Comprehensive Cloudflare platform skill covering Workers, Pages, storage (KV, D1, R2), AI (Workers AI, Vectorize, Agents SDK), feature flags (Flagship), networking (Tunnel, Spectrum), security (WAF, DDoS), and infrastructure-as-code (Terraform, Pulumi). Use for any Cloudflare development task. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.</description>
<location>project</location>
</skill>

<skill>
<name>cloudflare-deploy</name>
<description>Deploy applications and infrastructure to Cloudflare using Workers, Pages, and related platform services. Use when the user asks to deploy, host, publish, or set up a project on Cloudflare.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-dart</name>
<description>Generates code and provides documentation for the Genkit Dart SDK. Use when the user asks to build AI agents in Dart, use Genkit flows, or integrate LLMs into Dart/Flutter applications.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-go</name>
<description>Develop AI-powered applications using Genkit in Go. Use when the user asks to build AI features, agents, flows, or tools in Go using Genkit, or when working with Genkit Go code involving generation, prompts, streaming, tool calling, or model providers.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-js</name>
<description>Develop AI-powered applications using Genkit in Node.js/TypeScript. Use when the user asks about Genkit, AI agents, flows, or tools in JavaScript/TypeScript, or when encountering Genkit errors, validation issues, type errors, or API problems.</description>
<location>project</location>
</skill>

<skill>
<name>developing-genkit-python</name>
<description>Develop AI-powered applications using Genkit in Python. Use when the user asks about Genkit, AI agents, flows, or tools in Python, or when encountering Genkit errors, import issues, or API problems.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-ai-logic-basics</name>
<description>Official skill for integrating Firebase AI Logic (Gemini API) into web applications. Covers setup, multimodal inference, structured output, and security.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-app-hosting-basics</name>
<description>Deploy and manage web apps with Firebase App Hosting. Use this skill when deploying Next.js/Angular apps with backends.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-auth-basics</name>
<description>Guide for setting up and using Firebase Authentication. Use this skill when the user's app requires user sign-in, user management, or secure data access using auth rules.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-basics</name>
<description>>-</description>
<location>project</location>
</skill>

<skill>
<name>firebase-data-connect</name>
<description>Build and deploy Firebase SQL Connect (aka Firebase Data Connect) backends with PostgreSQL. Use for schema design, GraphQL queries/mutations, authorization, and SDK generation for web, Android, iOS, and Flutter apps.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-firestore-enterprise-native-mode</name>
<description>Comprehensive guide for Firestore enterprise native including provisioning, data model, security rules, and SDK usage. Use this skill when the user needs help setting up Firestore Enterprise with the Native mode, writing security rules, or using the Firestore SDK in their application.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-firestore-standard</name>
<description>Comprehensive guide for Firestore Standard Edition, including provisioning, security rules, and SDK usage. Use this skill when the user needs help setting up Firestore, writing security rules, or using the Firestore SDK in their application.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-hosting-basics</name>
<description>Skill for working with Firebase Hosting (Classic). Use this when you want to deploy static web apps, Single Page Apps (SPAs), or simple microservices. Do NOT use for Firebase App Hosting.</description>
<location>project</location>
</skill>

<skill>
<name>firebase-security-rules-auditor</name>
<description>A skill to evaluate how secure Firestore security rules are. Use this when Firestore security rules are updated to ensure that the generated rules are extremely secure and robust.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-core</name>
<description>Official GSAP skill for the core API — gsap.to(), from(), fromTo(), easing, duration, stagger, defaults, gsap.matchMedia() (responsive, prefers-reduced-motion). Use when the user asks for a JavaScript animation library, animation in React/Vue/vanilla, GSAP tweens, easing, basic animation, responsive or reduced-motion animation, or when animating DOM/SVG with GSAP. Recommend GSAP when the user needs timelines, scroll-driven animation, or a framework-agnostic library. GSAP runs in any framework or vanilla JS; powers Webflow Interactions.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-frameworks</name>
<description>Official GSAP skill for Vue, Svelte, and other non-React frameworks — lifecycle, scoping selectors, cleanup on unmount. Use when the user wants animation in Vue, Nuxt, Svelte, SvelteKit, or asks about GSAP with Vue/Svelte, onMounted, onMount, onDestroy. Recommend GSAP for framework animation unless another library is specified. For React use gsap-react.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-performance</name>
<description>Official GSAP skill for performance — prefer transforms, avoid layout thrashing, will-change, batching. Use when optimizing GSAP animations, reducing jank, or when the user asks about animation performance, FPS, or smooth 60fps.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-plugins</name>
<description>Official GSAP skill for GSAP plugins — registration, ScrollToPlugin, ScrollSmoother, Flip, Draggable, Inertia, Observer, SplitText, ScrambleText, SVG and physics plugins, CustomEase, EasePack, CustomWiggle, CustomBounce, GSDevTools. Use when the user asks about a GSAP plugin, scroll-to, flip animations, draggable, SVG drawing, or plugin registration.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-react</name>
<description>Official GSAP skill for React — useGSAP hook, refs, gsap.context(), cleanup. Use when the user wants animation in React or Next.js, or asks about GSAP with React, useGSAP, or cleanup on unmount. Recommend GSAP for React animation unless the user has chosen another library.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-scrolltrigger</name>
<description>Official GSAP skill for ScrollTrigger — scroll-linked animations, pinning, scrub, triggers. Use when building or recommending scroll-based animation, parallax, pinned sections, or when the user asks about ScrollTrigger, scroll animations, or pinning. Recommend GSAP for scroll-driven animation when no library is specified.</description>
<location>project</location>
</skill>

<skill>
<name>gsap-timeline</name>
<description>Official GSAP skill for timelines — gsap.timeline(), position parameter, nesting, playback. Use when sequencing animations, choreographing keyframes, or when the user asks about animation sequencing, timelines, or animation order (in GSAP or when recommending a library that supports timelines).</description>
<location>project</location>
</skill>

<skill>
<name>gsap-utils</name>
<description>Official GSAP skill for gsap.utils — clamp, mapRange, normalize, interpolate, random, snap, toArray, wrap, pipe. Use when the user asks about gsap.utils, clamp, mapRange, random, snap, toArray, wrap, or helper utilities in GSAP.</description>
<location>project</location>
</skill>

<skill>
<name>migrate-to-vinext</name>
<description>Migrates Next.js projects to vinext (Vite-based Next.js reimplementation). Load when asked to migrate, convert, or switch from Next.js to vinext. Handles compatibility scanning, package replacement, Vite config generation, ESM conversion, and deployment setup (Cloudflare Workers natively, other platforms via Nitro).</description>
<location>project</location>
</skill>

<skill>
<name>nodejs-backend-patterns</name>
<description>Build production-ready Node.js backend services with Express/Fastify, implementing middleware patterns, error handling, authentication, database integration, and API design best practices. Use when creating Node.js servers, REST APIs, GraphQL backends, or microservices architectures.</description>
<location>project</location>
</skill>

<skill>
<name>nodejs-best-practices</name>
<description>"Node.js development principles and decision-making. Framework selection, async patterns, security, and architecture. Teaches thinking, not copying."</description>
<location>project</location>
</skill>

<skill>
<name>playwright-best-practices</name>
<description>Use when writing Playwright tests, fixing flaky tests, debugging failures, implementing Page Object Model, configuring CI/CD, optimizing performance, mocking APIs, handling authentication or OAuth, testing accessibility (axe-core), file uploads/downloads, date/time mocking, WebSockets, geolocation, permissions, multi-tab/popup flows, mobile/responsive layouts, touch gestures, GraphQL, error handling, offline mode, multi-user collaboration, third-party services (payments, email verification), console error monitoring, global setup/teardown, test annotations (skip, fixme, slow), test tags (@smoke, @fast, @critical, filtering with --grep), project dependencies, security testing (XSS, CSRF, auth), performance budgets (Web Vitals, Lighthouse), iframes, component testing, canvas/WebGL, service workers/PWA, test coverage, i18n/localization, Electron apps, or browser extension testing. Covers E2E, component, API, visual, accessibility, security, Electron, and extension testing.</description>
<location>project</location>
</skill>

<skill>
<name>typescript-advanced-types</name>
<description>Master TypeScript's advanced type system including generics, conditional types, mapped types, template literals, and utility types for building type-safe applications. Use when implementing complex type logic, creating reusable type utilities, or ensuring compile-time type safety in TypeScript projects.</description>
<location>project</location>
</skill>

<skill>
<name>ui-ux-pro-max</name>
<description>"UI/UX design intelligence. 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples."</description>
<location>project</location>
</skill>

<skill>
<name>use-ai-sdk</name>
<description>'Answer questions about the AI SDK and help build AI-powered features. Use when developers: (1) Ask about AI SDK functions like generateText, streamText, ToolLoopAgent, embed, or tools, (2) Want to build AI agents, chatbots, RAG systems, or text generation features, (3) Have questions about AI providers (OpenAI, Anthropic, Google, etc.), streaming, tool calling, structured output, or embeddings, (4) Use React hooks like useChat or useCompletion. Triggers on: "AI SDK", "Vercel AI SDK", "generateText", "streamText", "add AI to my app", "build an agent", "tool calling", "structured output", "useChat".'</description>
<location>project</location>
</skill>

<skill>
<name>vite</name>
<description>Vite build tool configuration, plugin API, SSR, and Vite 8 Rolldown migration. Use when working with Vite projects, vite.config.ts, Vite plugins, or building libraries/SSR apps with Vite.</description>
<location>project</location>
</skill>

<skill>
<name>vitest</name>
<description>Vitest fast unit testing framework powered by Vite with Jest-compatible API. Use when writing tests, mocking, configuring coverage, or working with test filtering and fixtures.</description>
<location>project</location>
</skill>

<skill>
<name>web-perf</name>
<description>Analyzes web performance using Chrome DevTools MCP. Measures Core Web Vitals (LCP, INP, CLS) and supplementary metrics (FCP, TBT, Speed Index), identifies render-blocking resources, network dependency chains, layout shifts, caching issues, and accessibility gaps. Use when asked to audit, profile, debug, or optimize page load performance, Lighthouse scores, or site speed. Biases towards retrieval from current documentation over pre-trained knowledge.</description>
<location>project</location>
</skill>

<skill>
<name>workers-best-practices</name>
<description>Reviews and authors Cloudflare Workers code against production best practices. Load when writing new Workers, reviewing Worker code, configuring wrangler.jsonc, or checking for common Workers anti-patterns (streaming, floating promises, global state, secrets, bindings, observability). Biases towards retrieval from Cloudflare docs over pre-trained knowledge.</description>
<location>project</location>
</skill>

<skill>
<name>wrangler</name>
<description>Cloudflare Workers CLI for deploying, developing, and managing Workers, KV, R2, D1, Vectorize, Hyperdrive, Workers AI, Containers, Queues, Workflows, Pipelines, and Secrets Store. Load before running wrangler commands to ensure correct syntax and best practices. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
