# Responsive Design Test Harness (Playwright)

Local-only harness that checks the calculator app across common mobile, tablet,
and desktop breakpoints. It is **not** part of CI/CD - run it on demand.

## What it checks

For every route (`/` and `/embed`) at every breakpoint:

1. **No horizontal overflow** - the page content never gets wider than the viewport.
2. **Visual regression** - a full-page screenshot is compared against a committed
   baseline; the test fails if the layout drifts.

### Breakpoints

| Project          | Viewport   | Represents              |
| ---------------- | ---------- | ----------------------- |
| `mobile-portrait`| 375 x 667  | iPhone SE               |
| `mobile-large`   | 390 x 844  | iPhone 12/13            |
| `tablet`         | 768 x 1024 | iPad (app's mobile bp)  |
| `laptop`         | 1366 x 768 | Common laptop           |
| `desktop`        | 1440 x 900 | Standard desktop        |
| `desktop-wide`   | 1920 x 1080| Full HD                 |

That's 2 routes x 6 breakpoints = 12 screenshots for marketing to eyeball in the
HTML report.

## First-time setup (once per machine)

```bash
pnpm install
pnpm exec playwright install chromium
```

## Generating / updating baselines

Baselines are committed in `e2e/responsive.e2e.ts-snapshots/`. Generate them the
first time, or regenerate after an **intentional** UI change:

```bash
pnpm test:e2e:update
```

> Note: Playwright screenshots are OS/render dependent. Baselines should be
> generated and reviewed on the same kind of machine that will run the checks.

## Running the harness

```bash
pnpm test:e2e          # run all breakpoints headless
pnpm test:e2e:ui       # interactive UI mode
pnpm test:e2e:report   # open the HTML report from the last run
```

The dev server (port 8080) starts automatically; an already-running `pnpm dev`
is reused.

To run a single breakpoint:

```bash
pnpm test:e2e --project=mobile-portrait
```
