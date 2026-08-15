<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ESA Finance Frontend Agent Guide

## Mission

Build a production-grade, role-aware frontend for PT Esa Gemilang Sakti's integrated Finance and Project Operations system. Every screen must help users understand the current state, blockers, next action, financial impact, and traceability back to source data.

The authoritative product references are the five PDFs in `../output/finance-system-requirements/`:

- `01_SRS_General.pdf`
- `02_SRS_Backend.pdf`
- `03_SRS_Frontend.pdf`
- `04_Blueprint_Sistem.pdf`
- `05_User_Journey.pdf`

Read the relevant document before implementing a domain flow. Do not invent financial rules when a requirement is marked for discovery or post-MVP.

## Product boundaries

- MVP domains: identity/access, project and SPH master data, rate versions, attendance import, payroll billing calculation, invoices and AR, payment requests and manual payments, documents, approvals, audit, and operational reporting.
- Optional/post-MVP: enterprise SSO/MFA, real-time attendance integration, customer portal/e-sign, bank reconciliation/integration, full accounting/ledger, and budgeting.
- One invoice represents one SPH. Branches linked to the SPH appear as invoice detail.
- PIC is the final approver and also records manual customer confirmation.
- Approved/released financial snapshots are immutable. Corrections create revisions, reversals, or next-period adjustments.
- Document Date and Entry Date are distinct fields and labels.
- Budget versus actual must not be presented as operational MVP data until the business policy is approved.

## UX principles

- Action-oriented: show status, blocker, owner, SLA/age, and next action near the top of each workflow screen.
- Traceable: KPI -> project/transaction -> calculation/source -> document -> audit trail.
- Safe by default: approval, rejection, release, payment, posting, and destructive actions require a review summary and confirmation. Reject/revise requires a reason.
- Data-dense but calm: support filters, sorting, sticky headers, column visibility, saved views, subtotal, export, and sensible responsive alternatives.
- Never encode status with color alone. Pair color with explicit text and an icon.
- Financial mutations wait for the server response. Limit optimistic UI to low-risk preferences.
- Error messages must be actionable and preserve user input. Surface correlation IDs for unexpected errors.

## Visual system

- Brand source: `public/image/logo_fix.svg`.
- Direction: premium financial operations, not retail banking and not a generic SaaS template.
- Primary foundation: warm charcoal (`#151715`) and off-white (`#f5f6f3`).
- Brand accent: restrained gold (`#c79c2e` / `#96701a`) taken from the logo. Gold indicates identity, focus, and key actions; do not flood large surfaces with gold.
- Semantic colors: green for healthy/success, amber for warning/review, red for overdue/error, blue for informational/processing, violet for AR/receivable context.
- Use compact 8-12px radii, subtle borders, minimal shadows, and generous whitespace. Avoid excessive gradients, glass effects, pill-shaped containers, and oversized dashboard headings.
- Use Font Awesome through `@fortawesome/react-fontawesome` as the primary application icon system. Import individual icons from `@fortawesome/free-solid-svg-icons` or `@fortawesome/free-regular-svg-icons`; never register or import an entire icon pack globally. Keep icon size, visual weight, label, and button treatment consistent. Do not use emoji as interface icons.
- Indonesian is the default UI language. Format money and dates for `id-ID`; keep API/export formats explicit and unambiguous.

## Architecture and implementation

- Core stack: Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4.
- Icons: Font Awesome React (`@fortawesome/react-fontawesome`, free solid, and free regular). Existing Lucide usage is legacy prototype code and should be migrated incrementally when a component is materially edited; do not mix icon families inside one component or feature.
- Charts: Recharts. Use it for line, area, bar, composed, pie/donut, and accessible responsive charts. Do not hand-build production charts with raw SVG.
- Data tables: TanStack Table. Keep pagination, sorting, filtering, and row selection ready for server-controlled state.
- Server state: TanStack Query. Keep query keys centralized by domain; financial mutations must invalidate/refetch authoritative data and must not use optimistic updates.
- Forms: React Hook Form with Zod and `@hookform/resolvers`. A Zod schema is the shared client validation contract; map backend `field_errors` into the same form.
- File input: React Dropzone for attendance import and transaction documents. File type/size checks in the browser are only early feedback; backend validation and scanning remain authoritative.
- Date utilities: date-fns. Display with Indonesian locale and keep API values ISO-8601.
- Financial arithmetic: Decimal.js. Never use binary floating-point arithmetic for money, tax, rounding, allocation, reconciliation, or totals.
- Notifications: Sonner for short non-critical feedback. Financial results must also remain visible in page state/activity timeline.
- Class composition: `clsx` and `tailwind-merge`, preferably through one shared `cn()` helper.
- Read the relevant local Next.js guide under `node_modules/next/dist/docs/` before relying on framework behavior.
- Keep pages and layouts as Server Components by default. Add `"use client"` only at the smallest boundary that needs state, event handlers, effects, or browser APIs.
- Organize substantial features by domain (`projects`, `attendance`, `billing`, `disbursement`, `ar`, `reports`, `admin`) with reusable primitives for tables, statuses, money, dates, documents, approvals, and activity timelines.
- Treat permission checks in the UI as presentation only. The backend remains authoritative.
- Never store secrets or sensitive financial/PII data in localStorage. Mask NIK, NPWP, bank accounts, and protected documents according to permissions.
- API errors should support `{ code, message, field_errors, retryable, correlation_id }`. Handle 403, 409, 422, and 5xx as distinct states.
- Sensitive POST requests must be ready for an `Idempotency-Key`. Versioned edits must be ready for ETag/version conflicts.
- Prefer semantic HTML, native controls, visible focus, keyboard access, associated labels/errors, table captions/headers, and WCAG 2.1 AA contrast.

## Library usage rules

- Reuse the approved stack before adding a new dependency. A new library needs a concrete missing capability, compatibility review with React 19/Next.js 16, bundle impact review, and documentation in this file.
- Do not add a second chart, form, table, notification, date, or icon library for the same purpose.
- Unit tests use Vitest because it supports TypeScript/ES modules and the installed Next.js 16 + React 19 toolchain. React Testing Library, user-event, jest-dom matchers, and jsdom are the approved minimal DOM tooling for production component behavior that cannot be verified through pure domain tests; do not add a separate E2E framework without a concrete need.
- Recharts components must be dynamically loaded when a heavy report is below the fold or not needed for initial rendering. Every chart needs a descriptive title, unit, legend, tooltip, empty/loading state, and a text/table equivalent for accessibility.
- Recharts data must receive already-normalized numeric series; formatting belongs in shared formatters. Do not calculate finance totals inside tooltip components.
- Font Awesome icons must be imported individually for tree-shaking. Icon-only buttons require an accessible name and visible tooltip where meaning is not obvious.
- TanStack Table must use stable column definitions and controlled state for server pagination/filter/sort. Large datasets are never fully loaded solely for client-side filtering.
- TanStack Query requests must support cancellation where practical. Retry financial mutations only when the backend explicitly marks the error as retryable and idempotency is guaranteed.
- React Hook Form should avoid unnecessary controlled inputs. Use `Controller` only for components that cannot expose a normal input ref/value contract.
- Zod handles presentation-level validation and response parsing; it must not duplicate or override server-authoritative permission and workflow rules.
- Decimal.js values must cross the UI boundary as strings or explicit decimal representations. Format only at presentation time and never parse formatted Rupiah back into calculations.
- Sonner toasts must not be the sole record of approve, reject, release, payment, receipt, posting, or other financial actions.

## Required UI states

Every data-driven screen must explicitly implement or design for:

- loading/skeleton
- empty with a useful next step
- populated
- filtered with zero results
- validation errors near fields and in a summary
- permission denied without leaking data
- conflict/stale version with diff and safe reload
- recoverable server error with correlation ID and retry
- long-running import/export progress and downloadable error report

## Core screens

1. Role-aware dashboard and work queues.
2. Project list/detail with overview, contract, rates, workforce, invoices, expenses, profitability, documents, and audit tabs.
3. Effective-dated rate version timeline and compare view.
4. Attendance import, mapping preview, validation table, duplicates, and commit summary.
5. Payroll billing run with component breakdown, anomalies, adjustments with reason, and lock.
6. Invoice builder, source reconciliation, tax/rounding explanation, confirmation evidence, version diff, approval, PDF preview, release, and send log.
7. Payment request, duplicate/document warnings, approval, approved payment queue, bank reference, and evidence upload.
8. AR aging, receipt allocation, partial/full/overpayment states, and customer statement.
9. Profitability, cost, cash flow, payment/document monitoring, export, and drill-down.
10. Users/roles, SoD warnings, and read-only audit explorer.

## Quality gates

Before handing off a change:

- Run `npm run lint`.
- Run `npm run build` for meaningful feature or configuration changes.
- Verify the primary desktop view, tablet at 768px, and a mobile approval/review view.
- Check keyboard navigation, visible focus, readable statuses without color, and no clipped/overlapping content.
- Confirm figures in dashboard/prototype data reconcile internally and are clearly mock data when no API is connected.
- Do not claim a workflow is complete if actions are only visual placeholders; state what is mocked.
