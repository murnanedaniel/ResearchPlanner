# ResearchPlanner — Project Status Overview

> Generated: 2026-03-13

---

## About the Project

**ResearchPlanner** (branded "DoGraph") is an interactive, graph-based research planning web application. Users build a directed node graph representing research tasks or steps, connect them with annotated edges, and use AI assistance to auto-generate intermediate steps toward a goal.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.1 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, Tailwind CSS 3, shadcn/ui, Radix UI |
| Graph canvas | react-zoom-pan-pinch, d3-polygon |
| Editor | MDXEditor 3 |
| AI | OpenAI GPT-4o (via `/api/autocomplete`) |
| Calendar | Google Calendar API (OAuth) |
| Testing | Jest 29, @testing-library/react |
| Docs | VitePress |

---

## Current Feature Set

- **Interactive graph canvas** — drag nodes, draw directional edges, zoom/pan
- **Node hierarchy & subgraphs** — parent-child relationships with convex hull visualization; collapse/expand with ESC
- **Multi-select** — Ctrl+drag selection box, bulk delete/mark-obsolete
- **AI autocomplete** — GPT-4o generates intermediate steps between a start and goal node
- **Timeline overlay** — date-based grid (daily/weekly/monthly) with node snapping
- **Google Calendar sync** — bidirectional OAuth sync between graph nodes and calendar events
- **Rich content** — Markdown descriptions on nodes and edges via MDXEditor
- **Configurable settings** — node size, font, arrow size, colors via SettingsContext
- **Persistence** — LocalStorage auto-save; JSON file import/export
- **Keyboard shortcuts** — Delete (remove), Escape (deselect/collapse), Alt+click (edge creation)

---

## Repository State

- **Current branch:** `claude/review-project-overview-UQFpw`
- **Latest commit:** `73d0e0d` — "Deep cleanup: Remove debug logs and unused code" (Dec 13, 2025)
- **Total commits:** 49 (all by Daniel Murnane)
- **Merged PRs:** #1 (collapse/explode feature), #2 (shrink children), #4 (gCal refactor)

---

## Open Issues

| # | Title | Type | Notes |
|---|-------|------|-------|
| [#3](../../issues/3) | Moving nodes is laggy on Mac | Bug | Reproduced on Safari + Chrome at heroku deployment |
| [#5](../../issues/5) | Add comprehensive keyboard shortcuts for all actions | Enhancement | Only Delete, Escape, Alt+click exist currently |
| [#6](../../issues/6) | UI/UX audit: ensure web-standard interactions | Enhancement | Cursors, hover states, context menus, tooltips |
| [#7](../../issues/7) | Improve pan/zoom responsiveness and snappiness | Enhancement | Feels sluggish vs. Figma/Miro |
| [#8](../../issues/8) | Fix buggy node collapse/expand behavior | Bug | Inconsistent; hull not removed on last-child delete |
| [#9](../../issues/9) | Remove 'Enter node title' field — instant node creation | UX | Create nodes first, name them later |
| [#10](../../issues/10) | Replace edge creation mode with keyboard shortcut | UX | Current click-mode flow is friction-heavy |
| [#11](../../issues/11) | Add keyboard shortcuts cheat sheet / help overlay | Enhancement | Accessible via `?` key |
| [#12](../../issues/12) | Remove dotted canvas border | UX | Canvas should feel infinite (it is 90,000px) |
| [#13](../../issues/13) | Evaluate hyperbolic/magnifier UI feature | Research | Listed in PROGRESS.md as planned, needs decision |
| [#14](../../issues/14) | Fix z-index selection behavior — unintuitive layering | Bug | Overlapping nodes/edges don't select predictably |

---

## Open Pull Requests

| # | Title | Branch | State | Addresses |
|---|-------|--------|-------|-----------|
| [#15](../../pull/15) | Remove node title input — instant node creation | `copilot/remove-node-title-requirement` | Draft | Issue #9 |
| [#16](../../pull/16) | [WIP] Replace edge creation mode with keyboard shortcut | `copilot/replace-edge-creation-mode` | Draft | Issue #10 |
| [#17](../../pull/17) | Add keyboard shortcuts cheat sheet overlay | `copilot/add-keyboard-shortcuts-cheat-sheet` | Draft | Issue #11 |
| [#18](../../pull/18) | Add comprehensive keyboard shortcuts for all actions | `copilot/add-keyboard-shortcuts` | Draft | Issue #5 |
| **[#19](../../pull/19)** | **Merge keyboard shortcuts + node title creation** | `claude/review-recent-prs-0UZ1N` | **Open** | Issues #5, #9, #11 |
| [#20](../../pull/20) | Web-standard UI interactions (cursors, tooltips, context menus) | `copilot/audit-ui-ux-interactions` | Draft | Issue #6 |
| [#21](../../pull/21) | Optimize pan/zoom with velocity animation | `copilot/improve-pan-zoom-responsiveness` | Draft | Issues #3, #7 |

### PR #19 — Key PR to Review

PR #19 (`claude/review-recent-prs-0UZ1N`) is the only non-draft open PR. It consolidates the work from drafts #15, #17, and #18 into a single cohesive change:

- New `useKeyboardShortcuts` hook — centralized, context-aware, platform-aware (Cmd/Ctrl)
- `KeyboardShortcutsDialog` component — in-app cheat sheet via `?` hotkey
- Zoom, timeline, and file operation shortcuts integrated into `ResearchPlanner.tsx`
- Default "Untitled" node/subgraph creation — removes the title-input-before-create flow

**Recommendation:** Review and merge PR #19 first; then evaluate whether drafts #15, #17, #18 can be closed as superseded.

---

## Suggested Priority Order

1. **Merge PR #19** — Keyboard shortcuts + instant node creation; already open and ready for review
2. **Review draft PRs #20, #21** — Pan/zoom optimization and UI polish; promote from draft when ready
3. **Fix issue #8** — Collapse/expand bugs affect core graph interaction
4. **Fix issue #14** — Z-index selection is a fundamental UX pain point
5. **Fix issues #3 / #7** — Node drag lag and pan/zoom feel (PR #21 addresses this)
6. **Issue #12** — Quick cosmetic win: remove canvas border
7. **Issue #13** — Research/decision task for magnifier feature before any implementation

---

## Key Files

```
/app
  page.tsx                        — Entry point
  layout.tsx                      — Root layout
  api/autocomplete/route.ts       — OpenAI GPT-4o endpoint

/components/ResearchPlanner
  ResearchPlanner.tsx             — Main orchestrator (908 lines)
  context/GraphContext.tsx        — Central state (nodes, edges, timeline)
  context/SettingsContext.tsx     — User preferences
  hooks/useNodeOperations.ts      — Node CRUD
  hooks/useEdgeOperations.ts      — Edge CRUD
  hooks/useGraphPersistence.ts    — LocalStorage save/load
  hooks/useCalendarIntegration.ts — Google Calendar sync
  NodeGraph/NodeGraph.tsx         — Canvas + selection box + edge rendering
  NodeGraph/Node.tsx              — Individual node component
  NodeGraph/TimelineGrid.tsx      — Date grid overlay
  SidePanel/                      — Right sidebar (edit node/edge content)
  SideToolbar/                    — Left sidebar (action controls)

/lib
  utils.ts                        — Shared utilities

/__tests__
  components/ResearchPlanner/     — Jest test suites
```
