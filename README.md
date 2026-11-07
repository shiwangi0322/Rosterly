# Rosterly – Smart Roster Management System

Rosterly is a frontend workforce scheduling application built as a Datastraw Technologies internship assignment. It helps operations teams plan employee-wise rosters across brands, processes and pods, detect coverage gaps, and keep leave and working rules in sync.

The demo workspace is **Datastraw Technologies**. All data lives in the browser (`localStorage` key `rosterly-app-v1`). There is no backend.

The product UI uses a navy, amber, white and cream theme with the Rosterly wordmark.

## Features

- **Dashboard** – live headcount, coverage, weekly staffing, today’s roster, leave and activity.
- **Schedule** – employee-wise month / week / day calendar, add and edit shifts, Generate Roster, CSV export.
- **Employees, Brands, Processes, Pods** – connected CRUD with assigned people and coverage.
- **Leave management** – casual, sick, planned and comp-off requests; approve/reject; approved leave removes clashing shifts.
- **Working rules** – working days, weekly hours, max shift length, rest period, breaks, weekly-off enforcement.
- **Conflicts & alerts** – overlaps, leave clashes, weekly-off violations, hour caps, rest gaps and understaffing, with Resolve / Dismiss.
- **Reports** – week/month utilization, brand coverage, shift mix and CSV downloads.
- **Settings** – organization profile, roster defaults, holidays, demo reset with confirmation.

## Technology stack

| Layer | Choice |
|---|---|
| UI | React 18 (JavaScript) |
| Bundler | Vite 8 |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| Icons | Lucide React |
| Dates | date-fns |
| Toasts | React Hot Toast |
| Persistence | Browser LocalStorage |

No TypeScript, Firebase, Supabase or other backend is used.

## Project folder structure

```
rosterly/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/                 # favicon
├── scripts/
│   └── verify-roster.mjs   # assignment + constraint checks
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── assets/             # Rosterly logo
    ├── context/AppContext.jsx
    ├── data/seed.js        # demo employees, brands, shifts, leave
    ├── hooks/useLocalStorage.js
    ├── pages/              # one file per route
    ├── components/
    │   ├── common/
    │   ├── layout/
    │   └── schedule/
    └── utils/rosterUtils.js
```

## Installation and setup

Requirements: Node.js 18 or later.

```bash
cd rosterly
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173/`).

Production build:

```bash
npm run build
npm run preview
```

No environment file is required. The app does not read API keys or `VITE_` variables.

If the UI looks out of date after pulling a new version, use **Settings → Reset demo data** so LocalStorage is replaced with the current seed.

## How roster generation works

**Generate Roster** only fills coverage gaps. It does not wipe an existing week.

For each working day in the selected range, and for each brand still below `minCoverage`:

1. Skip holidays and non-working weekdays.
2. Rank eligible **active** employees by current weekly hours (least loaded first).
3. An employee is eligible only if they are assigned to the brand **and** a matching process, are not on approved leave, weekly off or a holiday, do not already have a shift that day, and are under the weekly hour cap.
4. A concrete shift is built from the process default template (morning / evening / general / special).
5. The same `validateShift` rules used by the Add Shift form must pass. Invalid drafts are skipped.
6. Remaining shortage is returned as **unresolved coverage**, not as an invalid shift.

The generator never silently places someone who is inactive, on leave, on weekly off, already rostered that day, unassigned to the brand/process, over hours, or inside the rest window.

## Scheduling constraints

| Constraint | Behaviour |
|---|---|
| Approved leave / holiday | Cannot be scheduled; existing shifts are removed when leave is approved. |
| Weekly off | Blocked when “Require a weekly off” is on. |
| Overlapping shift | Same employee, same date, overlapping times is rejected. |
| Inactive employee | Cannot be scheduled. |
| Brand / process assignment | Employee must belong to both. |
| Max shift length | Default 9 hours including break deduction. |
| Weekly hours | Soft cap 48h; overtime allowed up to a hard cap of weekly hours + 12. Auto-generate will not exceed the weekly cap. |
| Minimum rest | Default 11 hours from the end of the previous shift (including same-day earlier shifts). |
| Brand minimum staffing | Understaffing is listed on Conflicts and in Generate Roster results. |

Pending leave does **not** block the roster. Only **approved** leave does.

## Data model

Shared React context (`AppContext`) persists one JSON document:

- `employees` – id, name, pod, `brandIds[]`, `processCodes[]`, weekly off, availability window, status.
- `brands` – min coverage, single-resource flag, processes, pod.
- `processes` – code (CS, ACC, RET, NDR), required staff, shift types, brands.
- `pods` – lead, owned brands, members via `employee.podId`.
- `shifts` – employee, date, start/end, break, brand, process, type.
- `leaves` – type, from/to, status (`pending` / `approved` / `rejected`).
- `holidays`, `rules`, `settings`, `activities`, `dismissedConflicts`.

Demo seed (reset restores this):

- 32 employees (31 active, 1 inactive).
- 12 brands; 10 single-resource (83%); Nike and Zara are multi-resource with several assigned people.
- 4 pods (Alpha–Delta) and 4 processes.
- 13 employees trained on more than one process.
- Weekly offs across all seven days.
- Approved, pending and rejected leave including comp-off.
- Company holidays (Diwali, Guru Nanak Jayanti, Christmas).

The demo calendar is anchored at **Friday, 6 November 2026** so screenshots stay stable.

## Current limitations

- Frontend-only: no login, roles, or multi-user sync. Anyone with the browser can edit the demo.
- Email / in-app notification toggles are stored preferences only.
- Help in the header opens a mailto link; there is no help centre.
- Wide week/month calendars and large tables scroll horizontally on small screens by design.
- CSV export downloads a file in the browser; it does not email a report.
- `recharts` is installed but charts that rendered as empty SVG in this environment were replaced with CSS bars so the demo never shows a blank chart.

## Future improvements

- Real authentication and manager vs agent roles.
- Server-backed persistence and audit log.
- Email or Slack alerts for coverage gaps and pending leave.
- Drag-and-drop shift moves on the calendar.
- What-if simulation (change rules and preview impact before save).
- Automated tests in CI (a local verifier lives in `scripts/verify-roster.mjs`).
