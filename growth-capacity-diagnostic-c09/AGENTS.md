# Fusion Starter

A production-ready full-stack React application template with integrated Express server, featuring React Router 6 SPA mode, TypeScript, Vitest, Zod and modern tooling.

While the starter comes with a express server, only create endpoint when strictly neccesary, for example to encapsulate logic that must leave in the server, such as private keys handling, or certain DB operations, db...

## Tech Stack

- **PNPM**: Prefer pnpm
- **Frontend**: React 18 + React Router 6 (spa) + TypeScript + Vite + TailwindCSS 3
- **Backend**: Express server integrated with Vite dev server
- **Testing**: Vitest
- **UI**: Radix UI + TailwindCSS 3 + Lucide React icons

## Project Structure

```
client/                   # React SPA frontend
├── pages/                # Route components (Index.tsx = home)
├── components/ui/        # Pre-built UI component library
├── App.tsx                # App entry point and with SPA routing setup
└── global.css            # TailwindCSS 3 theming and global styles

server/                   # Express API backend
├── index.ts              # Main server setup (express config + routes)
└── routes/               # API handlers

shared/                   # Types used by both client & server
└── api.ts                # Example of how to share api interfaces
```

## Key Features

## SPA Routing System

The routing system is powered by React Router 6:

- `client/pages/Index.tsx` represents the home page.
- Routes are defined in `client/App.tsx` using the `react-router-dom` import
- Route files are located in the `client/pages/` directory

For example, routes can be defined with:

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Index />} />
  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
  <Route path="*" element={<NotFound />} />
</Routes>;
```

### Styling System

- **Primary**: TailwindCSS 3 utility classes
- **Theme and design tokens**: Configure in `client/global.css` 
- **UI components**: Pre-built library in `client/components/ui/`
- **Utility**: `cn()` function combines `clsx` + `tailwind-merge` for conditional classes

```typescript
// cn utility usage
className={cn(
  "base-classes",
  { "conditional-class": condition },
  props.className  // User overrides
)}
```

### Express Server Integration

- **Development**: Single port (8080) for both frontend/backend
- **Hot reload**: Both client and server code
- **API endpoints**: Prefixed with `/api/`

#### Example API Routes
- `GET /api/ping` - Simple ping api
- `GET /api/demo` - Demo endpoint  

### Shared Types
Import consistent types in both client and server:
```typescript
import { DemoResponse } from '@shared/api';
```

Path aliases:
- `@shared/*` - Shared folder
- `@/*` - Client folder

## Development Commands

```bash
pnpm dev        # Start dev server (client + server)
pnpm build      # Production build
pnpm start      # Start production server
pnpm typecheck  # TypeScript validation
pnpm test          # Run Vitest tests
```

## Adding Features

### Add new colors to the theme

Open `client/global.css` and `tailwind.config.ts` and add new tailwind colors.

### New API Route
1. **Optional**: Create a shared interface in `shared/api.ts`:
```typescript
export interface MyRouteResponse {
  message: string;
  // Add other response properties here
}
```

2. Create a new route handler in `server/routes/my-route.ts`:
```typescript
import { RequestHandler } from "express";
import { MyRouteResponse } from "@shared/api"; // Optional: for type safety

export const handleMyRoute: RequestHandler = (req, res) => {
  const response: MyRouteResponse = {
    message: 'Hello from my endpoint!'
  };
  res.json(response);
};
```

3. Register the route in `server/index.ts`:
```typescript
import { handleMyRoute } from "./routes/my-route";

// Add to the createServer function:
app.get("/api/my-endpoint", handleMyRoute);
```

4. Use in React components with type safety:
```typescript
import { MyRouteResponse } from '@shared/api'; // Optional: for type safety

const response = await fetch('/api/my-endpoint');
const data: MyRouteResponse = await response.json();
```

### New Page Route
1. Create component in `client/pages/MyPage.tsx`
2. Add route in `client/App.tsx`:
```typescript
<Route path="/my-page" element={<MyPage />} />
```

## Production Deployment

- **Standard**: `pnpm build:client` (static SPA) or `pnpm build` (SPA + Node server)
- **Vercel**: From the repository root (`calculator/`), run `vercel` or connect Git — `vercel.json` at the repo root builds this app and publishes `dist/spa`. Optional: set Vercel **Root Directory** to `growth-capacity-diagnostic-c09` and use `pnpm build:client` / `dist/spa` in the dashboard instead.
- **Netlify**: `netlify.toml` in this directory (client-only build + optional API function)
- **Binary**: Self-contained executables (Linux, macOS, Windows)

### Production domain (`calc.joinkwikly.com`)

The calculator must be served from a `*.joinkwikly.com` host so the CTA can set a shared `calc_payload` cookie read by `dashboard.joinkwikly.com`.

1. **Vercel:** Project → Settings → Domains → add `calc.joinkwikly.com`
2. **DNS:** CNAME `calc` → `cname.vercel-dns.com` (or value shown in Vercel)
3. **Verify:** HTTPS works; `/embed` loads with `frame-ancestors *` (see root `vercel.json`)
4. **Cutover:** Update Webflow embeds (below), then retire `calc.aikwikly.com`

The calculator must be on `*.joinkwikly.com` for the `calc_payload` cookie to work. Metrics are sent via cookie only — not URL query params.

### Webflow embed snippets

Host script (page custom code, before `</body>`):

```html
<script src="https://calc.joinkwikly.com/kwikly-embed-host.js" defer></script>
```

Iframe (auto height with host script):

```html
<iframe
  src="https://calc.joinkwikly.com/embed/"
  width="100%"
  style="border:none;display:block;"
  scrolling="no"
  title="Kwikly Clinical Capacity Calculator"
></iframe>
```

Without the host script, add `min-height:900px` to the iframe `style`.

Local test: `pnpm dev` → `http://localhost:8080/embed-host-test.html`

### Rails enrollment integration (handoff)

On `GET /dashboard.joinkwikly.com/enrollment/office?utm_source=calculator`:

1. Read `calc_payload` cookie (JSON — see `shared/api.ts` → `CalculatorHubSpotPayload`)
2. Validate input ranges and non-negative opportunity dollars
3. Store in session; clear cookie after read
4. On enrollment completion, map to HubSpot (`CALCULATOR_HUBSPOT_PROPERTIES` in `shared/api.ts`)

Local dev on `localhost` cannot set `.joinkwikly.com` cookies — test the full flow on `calc.joinkwikly.com` (staging or production).

## Architecture Notes

- Single-port development with Vite + Express integration
- TypeScript throughout (client, server, shared)
- Full hot reload for rapid development
- Production-ready with multiple deployment options
- Comprehensive UI component library included
- Type-safe API communication via shared interfaces
