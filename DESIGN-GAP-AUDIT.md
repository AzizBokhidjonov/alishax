# Dizayn qo'llanmasi bo'yicha tafovutlar hisoboti
`frontend-design-guide.md` talablari va joriy kod solishtirildi.
Har bir topilma mustaqil tekshiruvchi agent tomonidan kodda qayta tasdiqlangan
(136 da'vodan 2 tasi rad etildi, qolgani birlashtirilib 111 ta bandga keltirildi).

## Umumiy holat

The foundations this guide cares most about are already in place: money is integer tiyin on BigInt through one `<Money>` component, dates are timezone-safe and component-wise, status colour is token-driven and never colour-alone, nav and route guards are built from permission keys (never role names), the access token lives only in memory with one shared refresh promise, Idempotency-Key is minted on form open at all three required call sites, and file access goes through an authed fetch rather than signed URLs. What is missing is mostly a layer above that: six shared primitives the guide names were never built (URL-backed list state, `useExport()`, one reversal presentation, the closed-period wall, floor/desk density tokens, a central `statusMeta` map), and their absence is what most per-screen gaps trace back to. Confirmation discipline stops one step short — tier-3 dialogs carry the reason and the audit banner but never a summary of exactly what will change, and four sensitive actions (permission-matrix save, override removal, capacity force, discount revoke) collect no reason at all. The two rush-hour screens the guide singles out — the attendance board and pickup verification — are desk-density tables with 32px targets, a 56–96px verification photo, no optimistic check-in and no offline queue. Finally, a recurring pattern across admin, finance and reports: the API and the i18n catalogues already support a filter or field the UI never sends (report `periodId`, charge `kind`, expense `month`, audit `userId`/`entityId`, `allowedScopes`, `ImportJob.status`, `recipientCount`, `debts.remind`), so a meaningful share of the list is wiring, not new design.

## Nima allaqachon yaxshi ishlaydi

Session & permissions: access token in memory only, refresh token httpOnly, concurrent 401s share one refresh promise; nav and RouteGuard both derived from the same permission-key table so a typed URL is gated; FORBIDDEN vs OUT_OF_SCOPE have distinct messages in both catalogues; all six role safety-rail codes (ROLE_PROTECTED, ROLE_IN_USE, LAST_OWNER, SELF_LOCKOUT, PRIVILEGE_ESCALATION, SENSITIVE_PERMISSION) are typed and translated; in-app permission changes refetch /auth/me and rebuild the nav without a reload.
Money & dates: integer tiyin as a string on BigInt everywhere, no float and no parseInt; one `<Money>` with tabular-nums; som input with a live tiyin preview; calendar dates parsed component-wise so they never cross the browser timezone, timestamps in Asia/Tashkent, dd.MM.yyyy + HH:mm, 1-based billing periods.
Forms & errors: one `useEntityForm`/`FormDialog` factory behind all 31 dialogs with real `<label for>`, aria-invalid/aria-describedby and inline errors; 422 field errors applied to the form with the dialog kept open; error text always resolved from `error.code` with an HTTP fallback; 5xx panels carry the traceId plus retry; 300 ms search debounce; upload size and MIME enforced client-side.
Finance correctness: billing preview writes nothing and every line has an explain trace; billing rules are versioned and immutable; Idempotency-Key minted on open for payments, notifications and billing commit; nothing is hard-deleted — reverse/cancel/deactivate are the real verbs; reversed and cancelled rows are excluded from allocation targets; manual FIFO allocation with per-charge remainders and an over-allocation warning; tariff snapshot wording present on both the edit and assign dialogs; totals footers on the two heaviest ledgers.
Daily ops: check-in is genuinely one tap with server timestamping; check-out is structurally impossible without a server-side pickup verdict; 409 ALREADY_CHECKED_IN is not surfaced as an error; corrections enforce the ≥10-char reason and are never inline on the board; temporary permissions capture window, grantor and mandatory reason; the active-permissions strip answers "who may collect today".
Records & admin: all four children filters plus a Clear-filters empty state and scroll restoration; medical alerts vs full record are two separate components over two endpoints, so a full field cannot structurally leak to the alerts surface; status change is an action with effective date, not a form field; find-or-create guardian tolerates three server duplicate shapes; deactivate-never-delete end to end; multiple scoped roles plus per-user overrides with mandatory reason; matrix save is a batched full replacement, never per-cell autosave; role clone and role-vs-role diff both real; opening_balances carries its extra warning; both locale catalogues are at full parity.
Shell: job-based nav grouping, skip link, aria-current with a non-colour active marker, prefers-reduced-motion, 44px form controls, one dashboard aggregate call per role with every tile linking to its filtered list.

## Tafovutlar

Jami: **111** — yuqori 30, o'rta 55, past 26. Hajm: S=59, M=45, L=7.

---

## Yuqori daraja

### `no-user-edit-form` A user can be created but never edited — no edit path exists in the UI

- **Qo'llanma:** §10.1 · **Holat:** missing · **Hajm:** M · **Soha:** Administration / users
- **Yetishmayapti:** useUpdateUser (users/api.ts:77-84) is dead code: UserFormDialog takes only `{trigger}` and calls useCreateUser, UserDetailPage's header has no action slot, and the row actions are only Deactivate/Activate. There is no way to fix a name typo, change a phone/email, set a user's language or reset a forgotten password, though UpdateUserDto models all of them and `users.edit`, `users.form.newPassword` and `users.form.language` are already translated and unused.
- **Tuzatish:** Give UserFormDialog an optional `user?: User` and drive it through useEntityForm({entity}) as RoleDialogs.tsx:19-44 already does: on edit call useUpdateUser(), hide roleId/branchIds (managed on the detail page), add an optional new-password field and a language select. Mount it as an Edit button in the UserDetailPage PageHeader children and as a row action in the list.
- **Fayllar:** `src/features/users/UsersPage.tsx`, `src/features/users/UserDetailPage.tsx`, `src/features/users/api.ts`, `src/components/forms/schemas/admin.ts`

### `matrix-cells-offer-disallowed-scopes` Every matrix cell offers all five scopes instead of the permission's allowedScopes

- **Qo'llanma:** §10.2, §12 · **Holat:** divergent · **Hajm:** M · **Soha:** Administration / roles
- **Yetishmayapti:** A module-level `SCOPES` const is rendered in every select regardless of row. `Permission.allowedScopes` (api/types/admin.ts:82) has zero usages and `permissionsApi.list()` — the only call that returns it — is never invoked, so an operator can pick `own_group` for settings:manage and only learn via a server rejection of a full-role replacement, with no per-cell feedback. §12 names this as an acceptance item.
- **Tuzatish:** Add `usePermissionsCatalog()` to features/users/api.ts wrapping permissionsApi.list({includeDeprecated:true}); build `key → allowedScopes` and replace `SCOPES.map` at PermissionMatrix.tsx:167 with `(allowed.get(permission.key) ?? SCOPES).map`. Apply the same map to the override dialog's scope select (UserDialogs.tsx:22). Prerequisite for the deprecated toggle and the effective-permissions grouping.
- **Fayllar:** `src/features/users/components/PermissionMatrix.tsx`, `src/features/users/api.ts`, `src/features/users/components/UserDialogs.tsx`, `src/api/types/admin.ts`

### `permission-matrix-save-unguarded` Matrix Save has no dirty state, no Discard, no confirmation and no reason — and saving one role silently discards unsaved edits to the others

- **Qo'llanma:** §10.2, §2.10 · **Holat:** missing · **Hajm:** M · **Soha:** Administration / roles
- **Yetishmayapti:** PermissionMatrix.tsx:130-141 fires `save(role.id)` directly with `disabled={replace.isPending}` as the only gate; there is no diff, no changed-cell marking and no Discard. Worse, the reset effect at :33-38 keys on matrix.data and useReplaceRolePermissions invalidates qk.rolesMatrix, so saving role A refetches and wipes unsaved edits to roles B..N with no warning. Granting a permission the matrix itself flags `sensitive` costs one click.
- **Tuzatish:** Compute a per-role diff of draft vs role.grants; disable Save when empty, badge the column with the changed-cell count, ring changed cells, and add a Discard that resets that role's draft. Guard the reset effect so it only seeds roles with no pending edits. Wrap Save in `<ConfirmDialog sensitive requireReason destructive>` whose `summary` lists added/removed/changed keys and flags sensitive ones (needs the summary prop from tier3-no-change-summary).
- **Fayllar:** `src/features/users/components/PermissionMatrix.tsx`, `src/components/common/ConfirmDialog.tsx`

### `imports-skipinvalid-and-commit-confirmation` skipInvalid is a bare toggle with no counts and Commit fires with no confirmation

- **Qo'llanma:** §10.4 · **Holat:** partial · **Hajm:** S · **Soha:** Administration / imports
- **Yetishmayapti:** ImportsPage.tsx:162-165 is a `<Switch>` beside a flat label with no interpolation, and :166-168 is a plain Button with no ConfirmDialog — while far smaller actions elsewhere are confirmed. The guide's exact wording ("Import 142 valid rows and skip 8 invalid?") is nowhere, so an operator importing opening_balances can drop N rows of starting debt without ever seeing N.
- **Tuzatish:** Compute `invalid = job.failed ?? job.errors?.length ?? 0` and `valid = totalRows - invalid`; replace the switch label with a new interpolated `imports.skipInvalidCounts` key in both system.ts catalogues. Wrap Commit in ConfirmDialog whose description states the counts and the entity, passing `sensitive` when entity === "opening_balances" (the standing warn banner at :129-134 already covers that entity's risk copy).
- **Fayllar:** `src/features/imports/ImportsPage.tsx`, `src/i18n/locales/uz/system.ts`, `src/i18n/locales/ru/system.ts`

### `imports-no-progress-polling` Import commit never polls — success is announced even when the server returns `processing`

- **Qo'llanma:** §10.4 · **Holat:** missing · **Hajm:** M · **Soha:** Administration / imports
- **Yetishmayapti:** ImportsPage.tsx:75-87 awaits commit, sets the job and toasts "Import bajarildi" without ever reading `result.status`, though ImportJob.status includes `processing`. importsApi.get(id) exists and is called from nowhere. On a large opening_balances file the operator walks away believing go-live debt was seeded while it is still mid-flight.
- **Tuzatish:** Add src/features/imports/api.ts with `useImportJob(id, enabled)` using `refetchInterval: q => q.state.data?.status === "processing" ? 2000 : false`, drive the card from that query instead of local state, show `processed / totalRows` while processing, and move the success toast behind `completed` and an error panel behind `failed`.
- **Fayllar:** `src/features/imports/ImportsPage.tsx`, `src/features/imports/api.ts`, `src/api/endpoints/misc.ts`

### `tier3-no-change-summary` Tier-3 dialogs never show a summary of exactly what will change

- **Qo'llanma:** §2.10 · **Holat:** partial · **Hajm:** M · **Soha:** Cross-cutting / confirmations
- **Yetishmayapti:** Every tier-3 site passes a generic constant, so cancelling one of several similar payment rows for the same child shows a byte-identical dialog whichever row was clicked: PaymentsPage.tsx:221, ChargesPage.tsx:197, PeriodsPage.tsx:143 (does not even name the period), ChildFinanceTab.tsx:119-129 (no description at all).
- **Tuzatish:** Add a `summary?: ReactNode` prop to ConfirmDialog.tsx rendered as a bordered definition list above the reason textarea (money through `<Money>`), then pass real values: payments → child, paidAt, amount, method, receiptNo; charges → child, period, description, amount, paid; periods → the `label` already computed at PeriodsPage.tsx:107 plus closedAt/closedBy; discounts → kind, value, validity, original reason. `description` is already ReactNode, so this is presentation consistency rather than a structural blocker.
- **Fayllar:** `src/components/common/ConfirmDialog.tsx`, `src/features/finance/PaymentsPage.tsx`, `src/features/finance/ChargesPage.tsx`, `src/features/finance/PeriodsPage.tsx`, `src/features/children/components/ChildFinanceTab.tsx`

### `reversal-presentation-missing` No shared reversal presentation — nothing is struck through, `colored` tints a cancelled payment green, and the reason is never shown on charges

- **Qo'llanma:** §2.2, §4.6, §7.4 · **Holat:** partial · **Hajm:** M · **Soha:** Cross-cutting / finance
- **Yetishmayapti:** `line-through` has zero hits repo-wide. Three ad-hoc badge copies (ChargesPage.tsx:173-177, PaymentsPage.tsx:190-194, ChildFinanceTab.tsx:169-173) are the whole treatment; the original row keeps full-strength styling and, because `<Money colored>` reads the positive amount, a cancelled 2 000 000 payment renders green. `charge.reversalReason` (billing.ts:82) is rendered nowhere, and offsetting rows can land pages away from their original.
- **Tuzatish:** Add `struck`/`reversed` variants to Money.tsx (line-through + muted) and a shared ReversalRow/rowToneClass helper in src/components/common/; mute and strike the original when `reversedAt`/`cancelledAt` is set, render the offsetting sign=-1 row directly beneath it in st-danger carrying reason and actor, and surface reversalReason in the charges description cell and cancelReason inline in PaymentsPage instead of only in PaymentDetailDialog. Add reversedBy/cancelledBy to Charge/Payment in api/types/billing.ts if the API returns them.
- **Fayllar:** `src/components/common/Money.tsx`, `src/features/finance/ChargesPage.tsx`, `src/features/finance/PaymentsPage.tsx`, `src/features/children/components/ChildFinanceTab.tsx`, `src/api/types/billing.ts`

### `money-table-presentation` Money columns are left-aligned and repeat the currency on every row

- **Qo'llanma:** §2.4, §12 · **Holat:** missing · **Hajm:** M · **Soha:** Design foundations / finance
- **Yetishmayapti:** Every money column except children-list debt and the debts d30plus column is left-aligned, so 90 000 and 900 000 start at the same x and the `justify-end` footer total floats beside a column it is meant to sum. `hideCurrency` is passed at 1 of 47 `<Money>` sites, so "so'm" repeats ~50 times per page while the headers carry no currency.
- **Tuzatish:** Introduce `<MoneyCell>` in Money.tsx emitting `<TableCell className="text-right">` with hideCurrency defaulted on, so alignment cannot be forgotten; apply to the amount/paid/debt/overdue/advance cells and heads in PaymentsPage, ChargesPage, DebtsPage, ExpensesPage, BillingPage. Append the currency to the money headers in both ledger.ts catalogues ("Summa, so'm" / "Сумма, сум"), keep it on dashboard tiles, and switch the TableCard footer to a real `<TableFooter>` row so the total lands in its column.
- **Fayllar:** `src/components/common/Money.tsx`, `src/components/common/TableCard.tsx`, `src/features/finance/PaymentsPage.tsx`, `src/features/finance/ChargesPage.tsx`, `src/features/finance/DebtsPage.tsx`, `src/features/expenses/ExpensesPage.tsx`, `src/features/finance/BillingPage.tsx`, `src/i18n/locales/uz/ledger.ts`, `src/i18n/locales/ru/ledger.ts`

### `density-tokens-missing` No desk/floor density tokens; the rush-hour screens use 32px action buttons

- **Qo'llanma:** §2.6, §1 · **Holat:** missing · **Hajm:** M · **Soha:** Design foundations
- **Yetishmayapti:** styles.css has no row-height, control-height or touch-target token, and buttonVariants offers only h-9/h-8/h-10 — nothing ≥44px. Form controls are correctly h-11, which makes the 32px one-tap check-in and check-out buttons the outlier on exactly the screens §1 says must be floor density.
- **Tuzatish:** Add `--row-h-desk/--row-h-floor`, `--control-h-desk/--control-h-floor`, `--touch-min-floor: 44px` to the @theme block in styles.css and expose them as utilities; add a `floor` size to buttonVariants (h-12 px-5 text-base); set `data-density="floor"` on the AttendancePage and PickupPage wrappers and have table.tsx:94 read row height from the token.
- **Fayllar:** `src/styles.css`, `src/components/ui/button.tsx`, `src/components/ui/table.tsx`, `src/features/attendance/AttendancePage.tsx`, `src/features/pickup/PickupPage.tsx`

### `form-submit-gating-and-validation-timing` Submit is disabled while the form is invalid, and every keystroke of a pristine field validates

- **Qo'llanma:** §2.7 · **Holat:** divergent · **Hajm:** S · **Soha:** Cross-cutting / forms
- **Yetishmayapti:** use-entity-form.ts:107 `canSubmit: form.formState.isValid && !pending` with `mode:"onChange"` (line 60) means a create dialog opens with a dead grey button and paints a red border on the first character typed — both explicitly ruled out by §2.7. Affects all 31 FormDialog call sites plus the enrollment wizard and ChangePasswordCard.
- **Tuzatish:** In use-entity-form.ts set `canSubmit: !pending`, `mode:"onBlur"`, `reValidateMode:"onChange"`, and delete the compensating `void form.trigger()` at line 76; let `form.handleSubmit` be the gate and focus the first errored field in its error callback. These must land together — onBlur alone would leave the current isValid gate permanently false. Drop `{shouldValidate:true}` from the manual setValue calls in PaymentFormDialog.tsx:102/116/123 and ChildFormFields.tsx:36/59/67/88.
- **Fayllar:** `src/hooks/use-entity-form.ts`, `src/components/forms/FormDialog.tsx`, `src/features/finance/components/PaymentFormDialog.tsx`, `src/features/children/components/ChildFormFields.tsx`

### `no-unsaved-work-guard` No autosave and no discard warning — Escape or a backdrop click silently loses a long form

- **Qo'llanma:** §2.7 · **Holat:** missing · **Hajm:** M · **Soha:** Cross-cutting / forms
- **Yetishmayapti:** `isDirty`/`beforeunload`/`useBlocker` have zero hits in src/. FormDialog.tsx:66 is a raw Radix Dialog with no interception, so the two forms §2.7 names by name — the child profile and the 16-row billing-rules JSON textarea (BillingRulesTab.tsx:101) — lose everything on a stray keypress.
- **Tuzatish:** Add an opt-in `confirmDiscard` prop to FormDialog.tsx that intercepts onOpenChange(false)/Cancel when dirty and raises an AlertDialog; expose `isDirty` from use-entity-form.ts; enable it on ChildFormDialog.tsx and BillingRulesTab.tsx's RulesFormDialog, and autosave the rules JSON draft under a `billing.rules.draft` key.
- **Fayllar:** `src/components/forms/FormDialog.tsx`, `src/hooks/use-entity-form.ts`, `src/features/children/components/ChildFormDialog.tsx`, `src/features/finance/components/BillingRulesTab.tsx`

### `list-state-in-url` No list state reaches the URL — filters, sort, page and q are module memory

- **Qo'llanma:** §2.8, §6.1, §9.2, §12 · **Holat:** missing · **Hajm:** L · **Soha:** Cross-cutting / tables
- **Yetishmayapti:** use-list-params.ts:39 and use-sticky-state.ts:19 both persist to a module-level Map, and `validateSearch`/`useSearch` have zero hits repo-wide, so no list survives F5 and no filtered view is shareable as a link. Reports is worst: it uses neither, so filters reset on every navigation.
- **Tuzatish:** Add zod `validateSearch` to each list route (bolalar, otaonalar, xodimlar, tolovlar, hisoblar, qarzlar, xarajatlar, xabarnomalar, audit, hisobotlar) declaring {page,limit,sort,q,...filters}; rewrite use-list-params.ts to read `useSearch()` and write `navigate({search,replace:true})` keeping the same ListParamsApi so the three call sites are unchanged; then migrate the useStickyState pages and ReportsPage.tsx:34-42 onto it. Keep use-sticky-state.ts only for non-shareable view state.
- **Fayllar:** `src/hooks/use-list-params.ts`, `src/hooks/use-sticky-state.ts`, `src/routes/bolalar.tsx`, `src/routes/otaonalar.tsx`, `src/routes/tolovlar.tsx`, `src/routes/hisoblar.tsx`, `src/routes/qarzlar.tsx`, `src/routes/audit.tsx`, `src/routes/hisobotlar.tsx`, `src/features/finance/PaymentsPage.tsx`, `src/features/reports/ReportsPage.tsx`

### `global-search-missing` No global search in the header and no `/` shortcut

- **Qo'llanma:** §3.1 · **Holat:** missing · **Hajm:** M · **Soha:** App shell
- **Yetishmayapti:** Topbar.tsx:84-119 is a date chip and two language buttons; CommandDialog is used only by the per-form EntityPicker, and the only global hotkey is Ctrl/Cmd+B. Reception must navigate to /bolalar and type into that page's filter — three interactions instead of one during the 07:30 rush.
- **Tuzatish:** Add src/components/common/GlobalSearch.tsx over the existing CommandDialog, querying children/guardians/payments in parallel with `limit:5` each, gated on P.childRead/P.guardianRead/P.paymentRead and debounced with useDebouncedValue. Add use-global-search-hotkey.ts registering `/` and Ctrl/Cmd+K with an input/textarea/contenteditable no-op, mirroring use-sidebar.ts:65-74. Mount in Topbar.tsx between the breadcrumb and the right-hand group; add `common.search.*` to both catalogues.
- **Fayllar:** `src/components/common/GlobalSearch.tsx`, `src/hooks/use-global-search-hotkey.ts`, `src/components/layout/Topbar.tsx`, `src/i18n/locales/uz/common.ts`, `src/i18n/locales/ru/common.ts`

### `branch-switcher-missing` No branch switcher; `branchIds` is stored and never read and no request is branch-scoped

- **Qo'llanma:** §3.1 · **Holat:** missing · **Hajm:** L · **Soha:** App shell
- **Yetishmayapti:** branchIds enters the auth context (AuthProvider.tsx:99) and is consumed by nothing but the user-edit form. No header control, no branch header on requests, and no list hook passes branchId (attendance/api.ts:15 accepts one no caller supplies), so a director over two sites sees one merged children list, attendance board and debtors list with no indication which site the numbers belong to. Creation forms silently default to branches[0].
- **Tuzatish:** Add src/components/layout/BranchSwitcher.tsx reading branchIds from useAuth() and names from useBranchOptions(): a static label when length===1, a dropdown when >1. Hold `activeBranchId` in a small context persisted like use-sidebar.ts:27-57, mount as the first item of Topbar's right-hand group, thread it into the hooks that already accept branchId (attendance, children, groups, comms) and into the query keys so switching refetches, and default new-entity branch fields to it instead of branches[0].
- **Fayllar:** `src/components/layout/BranchSwitcher.tsx`, `src/components/layout/Topbar.tsx`, `src/auth/AuthProvider.tsx`, `src/features/attendance/api.ts`, `src/features/children/api.ts`, `src/lib/query.ts`

### `no-shared-use-export-hook` No `useExport()` — export polling is inlined in one page, blocks it, and dies on navigation

- **Qo'llanma:** §4.5, §9.2, §12 · **Holat:** partial · **Hajm:** M · **Soha:** Cross-cutting / exports
- **Yetishmayapti:** The only 202 handling is a local `waitForJob` loop at ReportsPage.tsx:75-83 that disables all three buttons for up to 120s, has no live progress toast, no `job.error` and no retry, and dies with the component. PaymentsPage.tsx:71 and ImportsPage.tsx:51 drop the job branch silently (`if (result.kind !== "file") return`). EXPORT_POLL_LIMIT (constants.ts:8) is unused.
- **Tuzatish:** Create src/hooks/use-export.ts with a module-level job registry outside React so polling survives unmount: requestExport → file → saveBlob; job → persistent toast.loading polled every EXPORT_POLL_MS up to EXPORT_POLL_LIMIT; on ready fetch downloadUrl through requestResponse/saveBlob and swap to a success toast with a Download action; on failed show job.error with Retry. Replace ReportsPage.tsx:75-107 (drop the page-wide `busy` gate) and use it at PaymentsPage.tsx:68-77 and ImportsPage.tsx:47-55. Confirm with the backend whether exports' downloadUrl is pre-signed before deciding how line 97's window.open is replaced.
- **Fayllar:** `src/hooks/use-export.ts`, `src/features/reports/ReportsPage.tsx`, `src/features/finance/PaymentsPage.tsx`, `src/features/imports/ImportsPage.tsx`, `src/config/constants.ts`

### `closed-period-wall-missing` Closed periods are only discovered at submit — no lock at pick time anywhere

- **Qo'llanma:** §4.7, §7.2, §7.4, §12 · **Holat:** missing · **Hajm:** M · **Soha:** Cross-cutting / finance
- **Yetishmayapti:** `Period.status` is read in exactly one place in the app (PeriodsPage.tsx:108). ManualChargeDialog.tsx:64-68 offers closed periods unfiltered and unmarked, PaymentFormDialog.tsx:131-133 is a bare datetime-local with no period lookup, ExpenseDialogs.tsx:116-133 is unconstrained, and DateField.tsx has no period concept. The only path is a generic PERIOD_CLOSED toast after the round trip.
- **Tuzatish:** Add `usePeriodStatus(isoDate)` next to finance/api-catalog.ts resolving a date to open|closed|unknown via usePeriods(year); add `periodClosed`/`lockMessage` to DateFieldProps rendering a Lock icon plus the message; add `disabled` to SelectField's option type and mark closed periods disabled with a lock glyph in ManualChargeDialog; AND the flag into canSubmit in PaymentFormDialog and ExpenseDialogs. Add a `periods.closedWall` string to both finance.ts catalogues.
- **Fayllar:** `src/components/common/DateField.tsx`, `src/components/common/SelectField.tsx`, `src/features/finance/components/PaymentFormDialog.tsx`, `src/features/finance/components/ManualChargeDialog.tsx`, `src/features/expenses/components/ExpenseDialogs.tsx`, `src/features/finance/api-catalog.ts`, `src/i18n/locales/uz/finance.ts`, `src/i18n/locales/ru/finance.ts`

### `duplicate-guardian-card-dead-end` The 409 DUPLICATE guardian strip has no action wired, no children count and no "Edit details"

- **Qo'llanma:** §4.8 · **Holat:** partial · **Hajm:** M · **Soha:** Guardians
- **Yetishmayapti:** GuardianFormDialog's only action sits behind `{onDuplicate ? … : null}` and none of the three call sites passes it, so in production the user always sees a dead-end warning with zero buttons. The copy carries name and phone but not `childrenCount` (which exists and is rendered in the list), and there is no secondary action. Separately EnrollGuardianStep auto-links a reused guardian and only announces it afterwards, so a phone typo links a child to a stranger's record without the operator seeing whose.
- **Tuzatish:** Turn the strip into a card with name, phone, an interpolated `guardians.duplicate.children` count, a primary "Link to this child" and a secondary ghost "Edit details" that resets the form onto the existing record. Actually pass `onDuplicate`: add a create path to ChildGuardiansTab's LinkGuardianDialog wiring it to link.mutate, and in EnrollGuardianStep surface the same card and require an explicit confirm before childrenApi.linkGuardian.
- **Fayllar:** `src/features/guardians/components/GuardianFormDialog.tsx`, `src/features/children/components/ChildGuardiansTab.tsx`, `src/features/children/components/EnrollGuardianStep.tsx`, `src/i18n/locales/uz/people.ts`, `src/i18n/locales/ru/people.ts`

### `checkin-not-optimistic-no-offline-queue` Check-in blocks on the network — no optimistic apply, no queue, no retry, no pending indicator

- **Qo'llanma:** §4.9, §5.1, §12 · **Holat:** missing · **Hajm:** L · **Soha:** Attendance
- **Yetishmayapti:** useApiMutation has no onMutate/rollback and useCheckIn (attendance/api.ts:85-99) sets no retry and no persistence, so at 07:30 with 40 children each tap waits for the server and a dropped connection loses the check-in outright, leaving the board's `inside` counter wrong for the rest of the day. None of §4.9's four parts exists.
- **Tuzatish:** Add an `optimistic` option to useApiMutation (onMutate snapshots and patches the cache, onError rolls back, onSettled invalidates) and use it in useCheckIn to write checkInAt onto the matching row of every attendanceToday cache entry. Add src/features/attendance/checkin-queue.ts: a localStorage FIFO of {childId, queuedAt, attempts} drained with exponential backoff (1/2/4/8s, cap 30s) and on `window online`; enqueue instead of rolling back on network failure. Render a pending chip in the board header — note `attendance.offlineHint` already exists unused in both daily.ts catalogues, so only the count string is new.
- **Fayllar:** `src/lib/query.ts`, `src/features/attendance/api.ts`, `src/features/attendance/checkin-queue.ts`, `src/features/attendance/components/AttendanceBoard.tsx`, `src/i18n/locales/uz/daily.ts`, `src/i18n/locales/ru/daily.ts`

### `attendance-medical-alert-text-hidden` Medical alert is a bare icon — the allergy text is fetched and discarded

- **Qo'llanma:** §5.1 · **Holat:** partial · **Hajm:** S · **Soha:** Attendance
- **Yetishmayapti:** AttendanceBoard.tsx:93-98 renders only `<AlertTriangle aria-label="Tibbiy ogohlantirish"/>`, though `row.alerts` is typed MedicalAlert[] with allergen/severity/instruction. Reception must leave the board to find out what the child is allergic to — the lookup §5.1 exists to remove.
- **Tuzatish:** Replace the icon-only cell with a danger-toned strip printing `alert.allergen` and `alert.instruction` for each entry in row.alerts, keeping the icon. The type carries only those three fields, so this stays structurally alerts-only per §6.2.
- **Fayllar:** `src/features/attendance/components/AttendanceBoard.tsx`

### `attendance-board-not-photo-cards` The attendance board is a 6-column table, not photo-first floor-density cards

- **Qo'llanma:** §5.1, §3.2 · **Holat:** partial · **Hajm:** L · **Soha:** Attendance
- **Yetishmayapti:** AttendanceBoard.tsx:75-141 renders child/group/status/checkIn/checkOut/actions as a table with px-4 py-3 cells, a `size="sm"` (32px) check-in button, no photo, no grouping by group and no collapsible sections — and it scrolls horizontally below 768px. AttendanceRecord carries no photo field, so nothing is available to render today.
- **Tuzatish:** Add AttendanceCard under features/attendance/components and replace the table block with `grid gap-3 sm:grid-cols-2 xl:grid-cols-3`: 64px photo, name, status badge, in/out times, one floor-size action button; group rows by groupId inside collapsible sections showing `groupName (n)`. For the photo, either add `childPhotoFileId` to AttendanceRecord in api/types/attendance.ts or join against useChildren({groupId, limit:200}) by childId. Depends on density-tokens-missing.
- **Fayllar:** `src/features/attendance/components/AttendanceBoard.tsx`, `src/api/types/attendance.ts`, `src/components/ui/button.tsx`

### `pickup-verify-photo-too-small` Verification photo is 96px on the page and 56px in the dialog, with no photo at all when denied

- **Qo'llanma:** §5.2 · **Holat:** partial · **Hajm:** M · **Soha:** Pickup
- **Yetishmayapti:** §5.2 requires the photo above everything at ≥200px because the photo *is* the verification; PickupPage.tsx:77 is h-24 (96px) and CheckOutDialog.tsx:87 is h-14 (56px) inside a max-w-md dialog — and the dialog is the path actually reached from the board. The denied branch renders no photo. CheckOutDialog's verdict is also a p-3 inline strip rather than a band (PickupPage's tinted card is already acceptable).
- **Tuzatish:** Extract src/features/pickup/components/VerifyCard.tsx used by both surfaces: photo first and centred at h-52 w-52, then a full-bleed verdict band (`-mx-6 px-6 py-4` in the dialog) in st-ok-soft/st-danger-soft with icon and word. Widen CheckOutDialog to max-w-lg and render the photo on the denied branch too.
- **Fayllar:** `src/features/pickup/components/VerifyCard.tsx`, `src/features/pickup/PickupPage.tsx`, `src/features/attendance/components/CheckOutDialog.tsx`

### `pickup-blocked-no-next-step` A blocked verdict shows the reason but offers no next step — no primary guardian, no tap-to-call

- **Qo'llanma:** §5.2 · **Holat:** partial · **Hajm:** M · **Soha:** Pickup
- **Yetishmayapti:** Both denied branches render icon + word + reason and nothing else; `tel:` appears exactly once in the repo, in the marketing site. The operator is left at a dead end with a parent in front of them, which §5.2 addresses explicitly.
- **Tuzatish:** In the shared VerifyCard, when allowed === false fetch the child's guardians and render the isPrimaryContact (fallback isPayer) guardian as a large `<a href={`tel:${phone}`}>` button with name and relationship, plus a secondary link into the pickup persons panel. The flags live on GuardianLink in api/types/org.ts:37-47.
- **Fayllar:** `src/features/pickup/PickupPage.tsx`, `src/features/attendance/components/CheckOutDialog.tsx`, `src/features/pickup/components/VerifyCard.tsx`

### `not-picked-up-no-dedicated-screen` No not-picked-up follow-up screen — a half-width card listing name and check-in time

- **Qo'llanma:** §5.3 · **Holat:** partial · **Hajm:** L · **Soha:** Attendance
- **Yetishmayapti:** useNotPickedUp has one consumer, a card inside InsidePage's two-column grid printing childName and formatTime at default size. There is no route, no nav entry, no group, no "how long past closing", no guardian phone — and the reception dashboard tile points its count at /olibketish, the verify screen, which shows no such list.
- **Tuzatish:** Add src/features/attendance/NotPickedUpPage.tsx + a route and nav entry gated on P.attendanceRead: one large card per child with name at text-2xl, group, check-in time and a computed lateness against `workingHours.close` (available on settings and on the group), plus the primary guardian as an h-14 tel: button; no pagination. Repoint the dashboard tile and the board banner at it.
- **Fayllar:** `src/features/attendance/NotPickedUpPage.tsx`, `src/routes/olibketilmaganlar.tsx`, `src/config/navigation.ts`, `src/features/attendance/InsidePage.tsx`, `src/features/dashboard/components/DashboardViews.tsx`, `src/api/types/attendance.ts`

### `groups-capacity-force-override` Capacity force: wrong permission on the group page, unreachable behind the modal, one unconfirmed click on the child page, and no reason anywhere

- **Qo'llanma:** §6.4, §2.10 · **Holat:** partial · **Hajm:** M · **Soha:** Groups
- **Yetishmayapti:** GroupDetailPage.tsx:100 gates on P.groupManage although the sensitive P.groupCapabilityOverride key exists and is used correctly on the child page. AssignChildDialog's force ConfirmDialog sets `sensitive` but not `requireReason`, and its trigger is a sibling of a Radix modal FormDialog that stays open after the failed submit — so the button sits behind the overlay and cannot be clicked at all. On ChildGroupCard the force button calls `submit(true)` immediately with no dialog and no reason. The audited notice is present; the stored reason and the numbers are not.
- **Tuzatish:** Change GroupDetailPage.tsx:100 to `can(P.groupCapacityOverride)`. Extract one `ForceCapacityConfirm` (ConfirmDialog with `sensitive requireReason reasonMinLength={10}` and a summary naming the group, current count and capacity) and render it inside the dialog body/footerStart when capacityHit is set — as ChildGroupCard already does structurally — replacing both the unreachable sibling in AssignChildDialog and the bare button in ChildGroupCard. Thread the reason through useAssignChild/useTransferChild.
- **Fayllar:** `src/features/groups/GroupDetailPage.tsx`, `src/features/groups/components/AssignChildDialog.tsx`, `src/features/children/components/ChildGroupCard.tsx`, `src/features/groups/api.ts`

### `billing-rules-save-without-simulate` Billing rules can be saved without simulating, and the draft rules cannot be simulated at all

- **Qo'llanma:** §7.1 · **Holat:** missing · **Hajm:** M · **Soha:** Finance / billing
- **Yetishmayapti:** RulesFormDialog posts a free-text JSON textarea gated only on form.canSubmit, and SimulateDialog is a wholly separate dialog. simulateSchema carries childId/year/month only, so the draft never reaches /billing-rules/simulate even though SimulateBillingDto.rules is supported — a diligent user still cannot simulate what they are about to save. §7.1 says never allow save-without-simulate.
- **Tuzatish:** Add `rules?: Record<string, unknown>` to simulateSchema and pass the parsed draft through. Fold Simulate into RulesFormDialog: hold `simulatedFor` (child+period+hash of rulesJson), render an in-dialog Simulate button calling useSimulateBilling with the draft, and gate `canSubmit` on `simulatedFor === currentRulesHash` so editing the JSON re-arms the requirement. Keep the standalone dialog as a read-only what-if against the active version.
- **Fayllar:** `src/features/finance/components/BillingRulesTab.tsx`, `src/components/forms/schemas/finance.ts`

### `no-bulk-debt-reminder-send` "Send reminder" does not exist — no bulk path from the debtors list, none from the child card, and the 20/min ceiling is never shown against a real count

- **Qo'llanma:** §7.3, §8.3 · **Holat:** missing · **Hajm:** L · **Soha:** Finance / communication
- **Yetishmayapti:** `debts.remind`/`debts.reminded` are translated in both catalogues with zero usages and `debt_reminder` exists only as a union member. DebtsPage has no selection column or row action, ChildOverviewTab's debt card has no action, and the only sender is a single-recipient dialog requiring a hand-picked template, a hand-picked guardian and a hand-typed JSON blob. The rate-limit line is static text with no count, because there is nothing bulk to count.
- **Tuzatish:** Give GuardianPicker/EntityPicker a `multiple` mode with removable chips; add `useSendDebtReminder` in finance/api-ledger.ts over notificationsApi.send hard-coding templateKey `debt_reminder` and building `data` from the DebtRow. Add a selection column plus a toolbar action to DebtsPage and a single-child button to the debt card, both opening a ConfirmDialog interpolating the count. Replace the static rateHint with a computed "N qabul qiluvchi — ~M daqiqa" using a new 20/min constant in config/constants.ts. Mint the Idempotency-Key on dialog open as SendNotificationDialog.tsx:68-71 already does.
- **Fayllar:** `src/features/finance/DebtsPage.tsx`, `src/features/children/components/ChildOverviewTab.tsx`, `src/features/finance/api-ledger.ts`, `src/features/comms/components/SendNotificationDialog.tsx`, `src/components/common/EntityPicker.tsx`, `src/config/constants.ts`

### `templates-no-variable-parity-validation` Nothing validates that uz and ru use the same variable set — the template form has no validation at all

- **Qo'llanma:** §8.2 · **Holat:** missing · **Hajm:** S · **Soha:** Communication / templates
- **Yetishmayapti:** TemplatesTab.tsx:39-51 sends bodyUz/bodyRu/variables straight to save.mutate with no placeholder comparison and no required check; Save is disabled only in flight. templateSchema exists in schemas/comms.ts and is never imported, so this is the one form with no zod layer and no 422 field mapping. A template with `{amount}` missing from bodyRu is accepted silently and every Russian debt reminder ships without the amount — and the preview cannot reveal it either.
- **Tuzatish:** Add `placeholders(text) => Set<string>` (`/\{(\w+)\}/g`), compute the symmetric difference of bodyUz/bodyRu against draft.variables on change, render the offending names under the body that lacks them and block submit while they differ. Route the tab through templateSchema with a superRefine — note the schema currently types `variables` as a string and must become `z.array(z.string())` first.
- **Fayllar:** `src/features/comms/components/TemplatesTab.tsx`, `src/components/forms/schemas/comms.ts`

### `reports-charges-period-filter-missing` The charges report declares a `period` filter that is never rendered or sent

- **Qo'llanma:** §9.2 · **Holat:** missing · **Hajm:** S · **Soha:** Insight / reports
- **Yetishmayapti:** reports/constants.ts:18 declares `filters:["period"]` but buildParams (ReportsPage.tsx:44-57) branches only on range/date/month/group and the filter JSX has no period branch, while OpenAPI declares `periodId` as required on GET /reports/finance/charges. Selecting Hisoblar shows an empty filter card and issues an unparameterised call — and the xlsx/pdf buttons share buildParams, so the exports are equally unparameterised.
- **Tuzatish:** Add `periodId` state plus a `selected.filters.includes("period")` branch in both buildParams (→ params.periodId) and the filter JSX, fed by a SelectField over usePeriods() labelled with periodLabel(). While in the file, declare and wire the `method` filter for finance/payments and `ageing` for finance/debts — both are accepted by the API and currently ignored.
- **Fayllar:** `src/features/reports/ReportsPage.tsx`, `src/features/reports/constants.ts`, `src/features/finance/api-catalog.ts`

### `reports-result-table-unformatted` Report results print raw API keys as headers and String(value) as cells — money appears as raw tiyin

- **Qo'llanma:** §9.2, §2.4, §2.5, §12 · **Holat:** divergent · **Hajm:** M · **Soha:** Insight / reports
- **Yetishmayapti:** ReportTable.tsx derives columns from Object.keys(rows[0]), prints the raw key as the header (`amountTiyin`, `createdAt`) and renders every cell as `String(...)` left-aligned with no tabular-nums; a nested object renders "[object Object]". The finance reports are the one surface showing unformatted tiyin, breaking §2.4, §2.5 and the §12 money rule at once.
- **Tuzatish:** Extend ReportDef in reports/constants.ts with `columns: {key, labelKey, kind: "money"|"date"|"datetime"|"text"|"number"}[]`; in ReportTable render money through `<Money>` right-aligned with tabular-nums and dates through formatDate/formatDateTime, falling back to the current key-derived behaviour only where no column map exists. Put the header labels under the existing `reports` block in both system.ts catalogues.
- **Fayllar:** `src/features/reports/components/ReportTable.tsx`, `src/features/reports/constants.ts`, `src/i18n/locales/uz/system.ts`, `src/i18n/locales/ru/system.ts`

### `audit-detail-is-raw-json` Audit detail renders before/after as two raw JSON.stringify blocks

- **Qo'llanma:** §9.3 · **Holat:** divergent · **Hajm:** M · **Soha:** Insight / audit
- **Yetishmayapti:** AuditPage.tsx:61-74 is two `<pre>` elements at text-xs — no key union, no per-field rows, no changed-field highlight, no money or date formatting. §9.3 rules this out by name, and the audit trail is the owner's stated reason for using the product.
- **Tuzatish:** Extract src/features/audit/components/AuditDiffTable.tsx modelled on the existing RoleDiffDialog.tsx:87-107: union the keys, one row per field (field / before / after), mark differing rows with st-warn plus a word or icon (never colour alone), format `*Tiyin` through `<Money>` and `*At`/`*Date` through formatDateTime/formatDate, and keep a collapsed raw-JSON disclosure for unknown fields.
- **Fayllar:** `src/features/audit/AuditPage.tsx`, `src/features/audit/components/AuditDiffTable.tsx`, `src/features/users/components/RoleDiffDialog.tsx`

---

## O‘rta daraja

### `effective-permissions-not-grouped` Effective permissions is a flat list and the source column prints the raw English enum

- **Qo'llanma:** §10.1 · **Holat:** partial · **Hajm:** M · **Soha:** Administration / users
- **Yetishmayapti:** UserTabs renders `(permissions.data ?? []).map(...)` as one flat table over ~52 keys with no grouping, and the source cell is `{permission.grantedBy ?? permission.source ?? "—"}` — so when grantedBy is omitted the cell literally shows `role` or `override`, untranslated. Role-derived grants and per-user overrides are visually identical, though the separate Overrides tab does answer the question in one extra click.
- **Tuzatish:** Use the permission catalogue (usePermissionsCatalog from the allowedScopes fix) to build key → group and emit a collapsible section header row per group; replace the source cell with `<Badge tone={source === "override" ? "warn" : "neutral"}>` and new `users.effective.fromRole`/`fromOverride` keys in both admin.ts catalogues, keeping grantedBy as a secondary line.
- **Fayllar:** `src/features/users/components/UserTabs.tsx`, `src/features/users/api.ts`, `src/i18n/locales/uz/admin.ts`, `src/i18n/locales/ru/admin.ts`

### `users-list-missing-role-and-branch-filters` The users list filters on status only, and shows neither roles nor branches

- **Qo'llanma:** §10.1 · **Holat:** partial · **Hajm:** S · **Soha:** Administration / users
- **Yetishmayapti:** The FilterBar is one SearchField plus a status select, though UserListParams declares role, status and branchId and useUsers forwards the whole object. "Show me every accountant" and "show me staff at the second branch" are impossible — the only way to narrow is free-text on name. `users.columns.roles` and `users.columns.branches` are translated and unrendered.
- **Tuzatish:** Add two SelectFields to the FilterBar: role from the already-imported useRoles() mapped through roleLabelKey with an allOption wired to setFilter("role"), and branch from the already-imported useBranchOptions() wired to setFilter("branchId"), rendered only when there is more than one branch. Seed both in the useListParams initial filters and add the two columns using the unused keys.
- **Fayllar:** `src/features/users/UsersPage.tsx`

### `matrix-no-client-side-privilege-guard` The matrix does not grey out permissions the current user does not hold

- **Qo'llanma:** §10.2 · **Holat:** missing · **Hajm:** S · **Soha:** Administration / roles
- **Yetishmayapti:** PermissionMatrix imports nothing from auth-context and the only cell `disabled` is `role.isProtected`; `permission.sensitive` is used cosmetically for a "· Maxsus" suffix. An operator can set scopes on permissions they do not hold across several rows and lose the entire full-replacement batch to one server rejection with no indication which cell caused it.
- **Tuzatish:** Add `const { can } = usePermissions()`, compute `locked = !can(permission.key) || (permission.sensitive && !can(P.roleManageSensitive))` per row, pass `disabled={role.isProtected || locked}` on the select, and surface the reason via title/tooltip using the existing errors.PRIVILEGE_ESCALATION and errors.SENSITIVE_PERMISSION strings.
- **Fayllar:** `src/features/users/components/PermissionMatrix.tsx`

### `matrix-rows-not-grouped-not-collapsible` Matrix rows are a flat list behind an exclusive group chip filter, not collapsible sections

- **Qo'llanma:** §10.2 · **Holat:** divergent · **Hajm:** M · **Soha:** Administration / roles
- **Yetishmayapti:** Permissions map into one flat tbody with the group name reprinted as muted text in every row; grouping is expressed as a one-group-at-a-time chip filter, so comparing a role's finance grants against its people grants costs two clicks and a lost scroll position. `roles.matrix.group` is translated and unused.
- **Tuzatish:** Group the filtered permissions into [group, permissions[]] pairs, hold a `collapsed: Set<string>`, and emit a full-width header row per group with a chevron toggle and a per-group granted count; keep the chips as a quick filter or drop them in favour of the headers.
- **Fayllar:** `src/features/users/components/PermissionMatrix.tsx`

### `receipt-number-format-no-live-preview` receiptNumberFormat is a bare text input with no preview of the number it produces

- **Qo'llanma:** §10.3 · **Holat:** missing · **Hajm:** S · **Soha:** Administration / settings
- **Yetishmayapti:** The field is a plain registered Input with no hint and no watch, and the schema types it as optionalText with no pattern validation, so the operator saves a token pattern blind and discovers a malformed one on the next receipt — a document that goes to a parent. Neither catalogue has a preview or example string.
- **Tuzatish:** Add `const format = form.watch("receiptNumberFormat")` and a pure `previewReceiptNumber(format)` helper in a new src/lib/receipt.ts substituting {YYYY}/{YY}/{MM}/{DD}/{SEQ}/{BRANCH} against today's date and a sample sequence; render the result through the Field `hint` prop (already used by the phones field) in tabular-nums, with the label added to both system.ts catalogues.
- **Fayllar:** `src/features/settings/SettingsPage.tsx`, `src/lib/receipt.ts`, `src/i18n/locales/uz/system.ts`, `src/i18n/locales/ru/system.ts`

### `imports-not-a-wizard` Imports is a flat page with three decorative step cards and no progress indicator

- **Qo'llanma:** §10.4 · **Holat:** partial · **Hajm:** S · **Soha:** Administration / imports
- **Yetishmayapti:** The three step cards contain only static strings and look identical before and after a successful validation; the entity choice is a SelectField in a FilterBar beside both action buttons, so all controls are live at once with no ordering. Nothing tells the operator which step they are on. A real Stepper with done/active/upcoming states already exists and is used by the enrollment wizard — its docstring even describes replacing this exact three-badge pattern.
- **Tuzatish:** Replace the three-card grid with `<Stepper steps={steps} current={step} />`, deriving step from existing state (!entity → entity, !job → template/upload, job && !committed → commit); add a fourth `imports.steps.entity` key to both system.ts catalogues and renumber the existing three.
- **Fayllar:** `src/features/imports/ImportsPage.tsx`, `src/components/common/Stepper.tsx`, `src/i18n/locales/uz/system.ts`, `src/i18n/locales/ru/system.ts`

### `imports-errors-not-exportable` The row-level import error table cannot be exported

- **Qo'llanma:** §10.4 · **Holat:** partial · **Hajm:** S · **Soha:** Administration / imports
- **Yetishmayapti:** The errors table has the right three columns but the page's only buttons are Download template, Validate and Commit. With a few hundred bad rows the operator must correct the source spreadsheet from a scrolling on-screen table they cannot hand to anyone or open beside Excel — breaking the fix-and-re-upload loop the wizard depends on.
- **Tuzatish:** Add a Download button in the errors CardHeader building a CSV client-side from job.errors (`row;field;message`, BOM-prefixed for Excel/Cyrillic) and passing it to the already-imported saveBlob; add an `imports.exportErrors` key to both system.ts catalogues.
- **Fayllar:** `src/features/imports/ImportsPage.tsx`, `src/i18n/locales/uz/system.ts`, `src/i18n/locales/ru/system.ts`

### `statusmeta-not-unified` No central statusMeta map — 9 of 11 domains are inline ternaries, and several tones diverge from the guide

- **Qo'llanma:** §2.1, §2.2 · **Holat:** partial · **Hajm:** M · **Soha:** Design foundations
- **Yetishmayapti:** StatusBadge holds only CHILD_STATUS_TONE and ATTENDANCE_TONE; payment, charge, period, notification, expense, import, billing-run and user tones are decided at the call site. Tones drift from §2.2 — most consequentially `absent: danger`, which paints a routine planned absence the same alarm red as a blocked pickup; also suspended warn (guide danger), graduated info (muted), sick info (warning), excused neutral (info), notification queued warn (info), expense unpaid danger (warning), billing discarded info (muted), closed period with no lock icon. Two states are never rendered at all: charge unpaid/partial/paid (Charge has no status field) and ImportJob.status.
- **Tuzatish:** Create src/config/status-meta.ts with one `STATUS_META: Record<Domain, Record<string, {tone, labelKey, icon?, struck?}>>` covering all eleven §2.2 rows with the guide's tones, and re-export typed badges (PaymentStatusBadge, ChargeStatusBadge, PeriodStatusBadge, NotificationStatusBadge, ExpenseStatusBadge, ImportStatusBadge, BillingRunStatusBadge, UserStatusBadge) from StatusBadge.tsx; replace the nine inline ternaries. Derive a charge status from amountTiyin vs paidTiyin plus sign, render job.status in ImportsPage, add the Lock icon to the closed-period badge, add a not_picked_up pseudo-status, and record late/early_departure as documented project extensions.
- **Fayllar:** `src/config/status-meta.ts`, `src/components/common/StatusBadge.tsx`, `src/features/finance/ChargesPage.tsx`, `src/features/finance/PeriodsPage.tsx`, `src/features/comms/NotificationsPage.tsx`, `src/features/expenses/ExpensesPage.tsx`, `src/features/imports/ImportsPage.tsx`, `src/features/finance/BillingPage.tsx`, `src/features/users/UsersPage.tsx`

### `override-remove-no-confirmation` Removing a per-user permission override has no confirmation at all

- **Qo'llanma:** §2.10 · **Holat:** missing · **Hajm:** S · **Soha:** Administration / users
- **Yetishmayapti:** UserTabs.tsx:123-131 is a bare ghost Button wrapping a lone Trash2 with no aria-label and no ConfirmDialog, while creating the same override requires a reason (overrideSchema in schemas/admin.ts:43-49). One unconfirmed click silently revokes — or re-grants, if it was a deny — a sensitive permission for a specific user with no reason recorded.
- **Tuzatish:** Wrap the button in `<ConfirmDialog sensitive destructive requireReason>` whose summary shows override.key, effect and scope, give it an aria-label, and extend useRemoveOverride to pass the reason.
- **Fayllar:** `src/features/users/components/UserTabs.tsx`, `src/features/users/api.ts`

### `period-reopen-insufficient-friction` Period reopen costs one character of reason — the same as cancelling one payment

- **Qo'llanma:** §2.10, §7.5 · **Holat:** missing · **Hajm:** S · **Soha:** Finance / periods
- **Yetishmayapti:** ConfirmDialog has no typed-confirmation prop and defaults reasonMinLength to 1, and PeriodsPage passes requireReason with no minimum — so a single character reopens a closed accounting month and the stored audit reason can be "x". The description does not even name the period, though the sibling close dialog one line up interpolates it. §7.5 says reopen should be the most friction-heavy action in the product. (reasonMinLength is currently passed by no caller anywhere.)
- **Tuzatish:** Add `confirmPhrase?: string` to ConfirmDialog rendering a labelled input under the reason and extending the disable condition to require an exact trimmed match; use it on the reopen dialog with `confirmPhrase={label}` and `reasonMinLength={10}`, and interpolate the period into the description.
- **Fayllar:** `src/components/common/ConfirmDialog.tsx`, `src/features/finance/PeriodsPage.tsx`, `src/i18n/locales/uz/finance.ts`, `src/i18n/locales/ru/finance.ts`

### `tier3-discount-revoke-no-reason` Revoking a discount is flagged sensitive but collects no reason and names nothing

- **Qo'llanma:** §2.10, §7.6 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / discounts
- **Yetishmayapti:** ChildFinanceTab's ConfirmDialog passes `sensitive destructive` with no requireReason and no description at all, so the body is just the audit banner and the reason argument is discarded. Creating a discount does require a reason (discountSchema), so removing one — which increases what the family owes — is strictly less friction than adding it.
- **Tuzatish:** Add a `description`/summary naming the discount kind, value, validity range and original reason now. Capturing a reason needs a backend change first: discountsApi.revoke is a body-less DELETE and openapi.json defines no requestBody or query param for it — file that against the API, then thread `{id, reason}` through useRevokeDiscount.
- **Fayllar:** `src/features/children/components/ChildFinanceTab.tsx`, `src/features/finance/api-catalog.ts`, `src/api/endpoints/finance.ts`

### `debts-ageing-not-toned-or-filterable` The four ageing buckets are identical grey cards and cannot be filtered on

- **Qo'llanma:** §2.2, §7.3 · **Holat:** partial · **Hajm:** M · **Soha:** Finance / debts
- **Yetishmayapti:** DebtsPage.tsx:79-88 renders notOverdue/1-7/8-30/30+ as four identical bordered cards with untoned Money, so severity is invisible without reading the numbers; §2.2 gives them a four-step muted→warning→warning-strong→danger scale. The tiles are also inert: `DebtListParams.ageing` is supported and `debts.filters.ageing` is translated, but no control sends it, so the director cannot drill from the 30+ tile into those children.
- **Tuzatish:** Add AGEING_TONE to config/status-meta.ts (notOverdue neutral, d1_7 warn, d8_30 warn-strong, d30plus danger) and apply the st-*-soft/border/fg trio to the bucket cards; make each card a button backed by `useStickyState("debts.ageing","all")` that sets the filter and passes `ageing` into useDebts, with the same value also selectable from a FilterBar SelectField. Add an ageing-bucket badge column to the debtors table.
- **Fayllar:** `src/features/finance/DebtsPage.tsx`, `src/config/status-meta.ts`

### `422-details-path-not-mapped` Server 422 `details[].path` is not handled — only a flat field→message object is

- **Qo'llanma:** §2.7 · **Holat:** partial · **Hajm:** S · **Soha:** Cross-cutting / forms
- **Yetishmayapti:** api/error.ts:107-115 iterates Object.entries(details) accepting only string or string[]; no path extraction exists anywhere. If the API returns the documented array-of-issues shape, every entry is dropped, no field lights up, and the user gets only a generic VALIDATION_FAILED toast with the dialog open and nothing marked.
- **Tuzatish:** Normalise three shapes in `fieldErrors` before mapping: the current flat map, `Array.isArray(details)` of {path, message}, and `details.issues`/`details.errors` arrays; join array paths with "." so nested RHF paths like `allocations.0.amountTiyin` resolve, and fall back to the generic toast only when nothing maps. Add a unit test per shape.
- **Fayllar:** `src/api/error.ts`, `src/hooks/use-entity-form.ts`

### `required-asterisk-not-applied` Required fields are marked on one form; select and money fields cannot be marked at all

- **Qo'llanma:** §2.7 · **Holat:** partial · **Hajm:** M · **Soha:** Cross-cutting / forms
- **Yetishmayapti:** FormDialog and DateField support a `required` marker, but of ~130 `<Field>` usages only four pass it. SelectFieldProps, MoneyInputProps and EntityPicker's PickerProps have no `required` member, so on the payment form child, amount, method and paidAt — all required by paymentSchema — are visually identical to the optional receipt no, bank ref, attachment and note.
- **Tuzatish:** Add `required?: boolean` to SelectFieldProps, MoneyInputProps (forwarding to the Field it already wraps) and EntityPicker's PickerProps, then mark the required fields in PaymentFormDialog, GuardianFormDialog, GroupFormDialog and UserDialogs. Deriving `required` from the zod schema's isOptional() in useEntityForm would stop it drifting.
- **Fayllar:** `src/components/common/SelectField.tsx`, `src/components/common/MoneyInput.tsx`, `src/components/common/EntityPicker.tsx`, `src/features/finance/components/PaymentFormDialog.tsx`

### `no-column-sorting-ui` Sort is hardcoded per page — `setSort` exists but is never called and no header is clickable

- **Qo'llanma:** §2.8 · **Holat:** partial · **Hajm:** M · **Soha:** Cross-cutting / tables
- **Yetishmayapti:** use-list-params exposes setSort and forwards `sort` into the query, but it has zero call sites; the only sorts are the construction literals on children, guardians and users, and the finance pages on useStickyState send no sort at all. Payments cannot be sorted by amount, charges by date, debtors by days overdue.
- **Tuzatish:** Add a `SortableHead` next to TableCard.tsx taking {field, sort, onSort}, rendering the label plus an asc/desc chevron inside a real `<button>` in the `<th>` (keyboard-operable per §2.11) and toggling `field:asc`/`field:desc`. Wire into ChildrenPage's heads and, once those pages move onto useListParams, PaymentsPage/ChargesPage/DebtsPage.
- **Fayllar:** `src/components/common/TableCard.tsx`, `src/hooks/use-list-params.ts`, `src/features/children/ChildrenPage.tsx`, `src/features/finance/PaymentsPage.tsx`

### `empty-state-no-results-vs-no-data` "No data" and "no results" are conflated — the shared default tells users to change filters they never set

- **Qo'llanma:** §2.8, §12 · **Holat:** partial · **Hajm:** M · **Soha:** Cross-cutting / tables
- **Yetishmayapti:** QueryState has one unconditional empty branch whose default description is `common.table.emptyHint` = "Filtrlarni o'zgartirib ko'ring", so a genuinely empty dataset shows a no-results message; the two states are inverted, not merely undifferentiated. FilterBar's Clear-filters button exists but `activeCount` reaches only three pages — the six filterable finance/admin lists mount a bare `<FilterBar>`, including Payments which defaults to a last-30-days window.
- **Tuzatish:** Add `hasFilters?: boolean` and `onReset` to QueryState, branch the title/description on it (`common.table.empty` vs a new `common.table.noResults` in both common.ts catalogues) and render the Clear-filters action there rather than per caller. Pass both from ChargesPage, DebtsPage, PaymentsPage, ExpensesPage, NotificationsPage and AuditPage, giving each a `<FilterBar activeCount onReset>` like ChildFilters already has.
- **Fayllar:** `src/components/common/QueryState.tsx`, `src/i18n/locales/uz/common.ts`, `src/i18n/locales/ru/common.ts`, `src/features/finance/ChargesPage.tsx`, `src/features/finance/DebtsPage.tsx`, `src/features/finance/PaymentsPage.tsx`, `src/features/expenses/ExpensesPage.tsx`, `src/features/comms/NotificationsPage.tsx`, `src/features/audit/AuditPage.tsx`

### `no-sticky-table-header-or-first-column` No table has a sticky header, and no wide table has a sticky first column

- **Qo'llanma:** §2.8, §3.2, §10.2 · **Holat:** missing · **Hajm:** M · **Soha:** Cross-cutting / tables
- **Yetishmayapti:** ui/table.tsx has no `sticky` anywhere; the only sticky thead in the app is the hand-rolled permission matrix, which in turn has no sticky first column. Scrolling a 7-column charges or debtors table right pushes the child name off screen, so an amount is read with no visible owner — and in the matrix a scope is chosen in a column with no visible row label.
- **Tuzatish:** Add an opt-in `sticky` prop on TableHeader applying `sticky top-0 z-10` (its bg-secondary/50 is already opaque) and a `stickyFirst` variant on Table applying `[&_tr>*:first-child]:sticky left-0 bg-card z-[1]`; enable both on the TableCard-wrapped finance tables and ChildrenPage. Separately add `sticky left-0 z-20 bg-card` to PermissionMatrix.tsx:121 and `z-10` to :149 with a right border.
- **Fayllar:** `src/components/ui/table.tsx`, `src/components/common/TableCard.tsx`, `src/features/finance/PaymentsPage.tsx`, `src/features/finance/ChargesPage.tsx`, `src/features/finance/DebtsPage.tsx`, `src/features/users/components/PermissionMatrix.tsx`

### `form-failed-save-no-inline-error` A failed save inside a dialog shows nothing next to the action — only a corner toast

- **Qo'llanma:** §2.9 · **Holat:** missing · **Hajm:** M · **Soha:** Cross-cutting / forms
- **Yetishmayapti:** FormDialogProps has no error prop and the footer is Cancel + Submit only; use-entity-form maps 422 details and nothing else, so a 409 (PERIOD_CLOSED, CAPACITY_EXCEEDED, DUPLICATE), 403 or 500 leaves the dialog open with every field looking valid while the explanation renders in a toast behind the overlay. GuardianFormDialog's hand-rolled duplicate strip is the one exception and proves the pattern is needed.
- **Tuzatish:** Add `error?: unknown` to FormDialogProps and render `errorMessage(t, error)` plus `errorTraceId(error)` in a danger strip immediately left of the submit button; expose the last non-422 error as `submitError` from useEntityForm and pass it from PaymentFormDialog, ManualChargeDialog and AssignChildDialog first — the three that actually receive 409s.
- **Fayllar:** `src/components/forms/FormDialog.tsx`, `src/hooks/use-entity-form.ts`, `src/features/finance/components/PaymentFormDialog.tsx`, `src/features/finance/components/ManualChargeDialog.tsx`, `src/features/groups/components/AssignChildDialog.tsx`

### `routine-saves-all-toast` Every routine save fires a success toast, including plain create/update/delete

- **Qo'llanma:** §2.9 · **Holat:** divergent · **Hajm:** M · **Soha:** Cross-cutting / feedback
- **Yetishmayapti:** lib/query.ts:143 toasts on every mutation that supplies a message, and 71 call sites do — including the generic `common.state.created/updated/deleted` across children, guardians, groups, settings, users, pickup, finance and expenses. Since the dialog already closes and the list already invalidates, the state change is visible on its own and the toast is noise on every row of a data-entry session. The guide reserves toasts for background actions.
- **Tuzatish:** Invert the default in useApiMutation — rename the option to `toast?: "background"` (or add `silent` defaulting true for CRUD) — then drop successMessage from the plain create/update/delete mutations and keep it only where the result is genuinely invisible: comms send, report/export ready, telegram invite, billing commit.
- **Fayllar:** `src/lib/query.ts`, `src/features/children/api.ts`, `src/features/guardians/api.ts`, `src/features/groups/api.ts`, `src/features/settings/api.ts`, `src/features/users/api.ts`, `src/features/pickup/api.ts`, `src/features/finance/api-catalog.ts`, `src/features/expenses/api.ts`

### `dashboard-landing-not-permission-routed` Everyone lands on /boshqaruv regardless of permissions

- **Qo'llanma:** §3.1 · **Holat:** partial · **Hajm:** S · **Soha:** App shell
- **Yetishmayapti:** LoginPage hard-codes navigate to /boshqaruv in both branches and the sidebar logo links there too; there is no landingRouteFor helper and no /dashboard/:role shape. A teacher without dashboard:read lands on an EmptyState with quick links rather than their group's attendance — not a dead end, but not the routing §3.1 describes.
- **Tuzatish:** Add `landingRouteFor(permissions)` to config/navigation.ts returning /boshqaruv when dashboard:read is held, else /davomat for attendance:read|checkin, else /bolalar for child:read, else the first nav item the user can see (reusing NavList's filtering); call it from both LoginPage navigations and from the SidebarContent logo link.
- **Fayllar:** `src/features/auth/LoginPage.tsx`, `src/config/navigation.ts`, `src/components/layout/SidebarContent.tsx`

### `dashboard-view-role-gated-and-not-remembered` Dashboard view is chosen by role name and forgotten on every visit

- **Qo'llanma:** §3.1, §9.1, §1 · **Holat:** partial · **Hajm:** S · **Soha:** Dashboards
- **Yetishmayapti:** DashboardPage.tsx:51 is a plain useState so the choice dies on unmount, and defaultView switches on the literal strings "accountant"/"reception"/"teacher" — a custom role like bosh_hisobchi with full accountant permissions falls through to the director panel, contradicting §1's "never gate UI on role names". The views array is unfiltered, so a reception user can select Director and land on a forbidden panel.
- **Tuzatish:** Replace the useState with a localStorage-backed hook keyed per user id (use-sidebar.ts:27-57 is the SSR-safe pattern; useStickyState would not survive a refresh). Rewrite defaultView to derive from permissions — accountant when chargeRead|paymentRead, reception when attendanceCheckIn|pickupRead, else director — and filter the views array to the panels the user's permissions justify.
- **Fayllar:** `src/features/dashboard/DashboardPage.tsx`

### `bottom-tab-bar-missing` No bottom tab bar below 768px — mobile nav is a hamburger over 23 items

- **Qo'llanma:** §3.2 · **Holat:** missing · **Hajm:** M · **Soha:** App shell
- **Yetishmayapti:** No bottom-navigation component exists; the Topbar sheet's own comment notes the drawer has to scroll because 23 menu items overflow the screen. A teacher on a phone opens a hamburger and scrolls that list to reach the board several times a day.
- **Tuzatish:** Add src/components/layout/BottomTabBar.tsx rendering `md:hidden fixed inset-x-0 bottom-0` with four permission-picked items from a new `primaryNavFor(permissions)` helper (Attendance → Children → Announcements → user menu, falling back to the first four visible). Mount after `<main>` in AppShell with `pb-20 md:pb-0` on main; 48px targets reusing NavList's focusRing/aria-current treatment.
- **Fayllar:** `src/components/layout/BottomTabBar.tsx`, `src/components/layout/AppShell.tsx`, `src/config/navigation.ts`

### `tables-not-cards-below-768` No table→card transformation below 768px for non-finance lists

- **Qo'llanma:** §3.2 · **Holat:** missing · **Hajm:** M · **Soha:** App shell / tables
- **Yetishmayapti:** ui/table.tsx wraps everything in `overflow-x-auto` unconditionally and no feature has an alternate card rendering, so the 6-column children list, the guardians list and the inside list all render as one wide table on a phone. The finance exception is implemented for everything; the rule for nothing. (Groups is already a card grid.)
- **Tuzatish:** Extend TableCard with an optional `cards?: (row) => ReactNode` render prop (or add a `<ResponsiveList>` in components/common) rendering `<Table>` at md: and up and stacked cards below; apply to ChildrenPage, GuardiansPage and InsidePage. The attendance board is covered by its own card redesign. Leave the finance tables on horizontal scroll per the guide's exception.
- **Fayllar:** `src/components/common/TableCard.tsx`, `src/features/children/ChildrenPage.tsx`, `src/features/guardians/GuardiansPage.tsx`, `src/features/attendance/InsidePage.tsx`

### `permissions-version-not-watched` `permissionsVersion` is stored but never compared — another admin's change is invisible until reload

- **Qo'llanma:** §4.1, §12 · **Holat:** partial · **Hajm:** M · **Soha:** Cross-cutting / permissions
- **Yetishmayapti:** /auth/me is fetched once on mount with no focus or interval refetch, `qk.me` has zero call sites, and permissionsVersion is only ever written. refreshMe fires only for changes the same user makes in the same tab, so a Director whose permission an Owner revokes keeps the old nav and enabled buttons for the rest of the session and then hits 403s with no explanation. §12 lists this as an acceptance item.
- **Tuzatish:** Move /auth/me into react-query under qk.me with refetchOnWindowFocus and a modest staleTime, derive AuthProvider state from that query instead of local useState, and when the incoming permissionsVersion differs from the held one call queryClient.invalidateQueries() so gated screens re-render. Keep the existing explicit refreshMe calls as the fast path.
- **Fayllar:** `src/auth/AuthProvider.tsx`, `src/auth/auth-context.ts`, `src/lib/query.ts`

### `child-photo-upload-and-authimage-surfaces` A child photo cannot be uploaded at all, and the settings logo and child header have no preview

- **Qo'llanma:** §4.4, §6.1, §6.2 · **Holat:** partial · **Hajm:** M · **Soha:** Records / files
- **Yetishmayapti:** No FileUploadField anywhere writes `photoFileId` and childSchema has no such field, though UpdateChildDto accepts it — so ChildRow's AuthAvatarImage is permanently on initials and the pickup surfaces have nothing to show. SettingsPage mounts a bare upload with no AuthImage preview (FileUploadField renders only a filename), and ChildDetailPage's header has no photo. The surviving `photoUrl` fallbacks reference a field that appears zero times in openapi.json, so they are permanently dead.
- **Tuzatish:** Add `photoFileId: optionalId` to childSchema and a `<FileUploadField>` with an image MIME allow-list to ChildFormFields' identity section; render `<AuthImage fileId>` next to the settings logo upload and in the child profile header. Delete the dead photoUrl fields from api/types/people.ts:29 and attendance.ts:100/146 and the `src=` fallbacks in PickupPage and CheckOutDialog so the authed path is the only one.
- **Fayllar:** `src/features/children/components/ChildFormFields.tsx`, `src/components/forms/schemas/people.ts`, `src/features/settings/SettingsPage.tsx`, `src/features/children/ChildDetailPage.tsx`, `src/api/types/people.ts`, `src/api/types/attendance.ts`, `src/features/pickup/PickupPage.tsx`

### `already-checked-in-not-treated-as-success` 409 ALREADY_CHECKED_IN is silenced but the board is never refreshed

- **Qo'llanma:** §4.9, §5.1, §12 · **Holat:** partial · **Hajm:** S · **Soha:** Attendance
- **Yetishmayapti:** useApiMutation invalidates only in onSuccess, and useCheckIn's onError toasts and returns — so after a replayed check-in the cache is untouched and the card keeps its Check-in button until the 60s poll. The hook's own comment claims the list is refreshed; the code does not do it. §12 requires the replay be treated as success, which means reaching the checked-in state immediately.
- **Tuzatish:** Give useApiMutation an `invalidateOnError?: boolean` (or an onSettled invalidation) and use it in useCheckIn so the ALREADY_CHECKED_IN branch invalidates ATTENDANCE_KEYS before toasting — or optimistically set checkInAt on the row. Give it the same visual treatment as a first-time check-in.
- **Fayllar:** `src/features/attendance/api.ts`, `src/lib/query.ts`

### `attendance-polling-too-slow-no-focus-refetch` The board polls every 60s and never refetches on focus

- **Qo'llanma:** §5.1 · **Holat:** partial · **Hajm:** S · **Soha:** Attendance
- **Yetishmayapti:** useAttendanceToday, useInside and useNotPickedUp all set refetchInterval 60_000, and router.tsx:26 turns refetchOnWindowFocus off globally with none of them overriding it. §5.1 asks for 20-30s plus focus, so a teacher marking from a tablet can be a minute invisible to reception and returning to the tab shows stale state.
- **Tuzatish:** Set `refetchInterval: 25_000` and `refetchOnWindowFocus: true` on those three queries as per-query overrides in attendance/api.ts, leaving the global default alone so finance tables keep their behaviour.
- **Fayllar:** `src/features/attendance/api.ts`

### `attendance-counters-not-tappable-no-banner` Header counters are static text and there is no not-picked-up warning banner

- **Qo'llanma:** §5.1 · **Holat:** partial · **Hajm:** M · **Soha:** Attendance
- **Yetishmayapti:** The board renders three read-only divs (present/inside/total) — not buttons, no `absent` and no `not picked up` counter — and the component has no status filter state, so the board cannot be narrowed to "who is still absent". useNotPickedUp is never called here, so the warning row from the §5.1 sketch does not exist.
- **Tuzatish:** Add a `filter` state (all|inside|absent|notPickedUp), turn the counters into `<button aria-pressed>` that set it, swap total for absent and add a not-picked-up counter, and filter rows accordingly. Call useNotPickedUp and, when non-empty, render a danger banner above the grid whose action sets filter=notPickedUp or links to the new follow-up screen.
- **Fayllar:** `src/features/attendance/components/AttendanceBoard.tsx`

### `attendance-no-aria-live` No aria-live region announcing check-ins on the board

- **Qo'llanma:** §5.1, §2.11 · **Holat:** missing · **Hajm:** S · **Soha:** Attendance
- **Yetishmayapti:** There is no `aria-live` literal anywhere in the repo and nothing in features/attendance; the only check-in feedback is a sonner toast. Both §5.1 and the §2.11 baseline name the attendance board explicitly.
- **Tuzatish:** Add a visually-hidden `<p aria-live="polite" className="sr-only">` in AttendanceBoard driven by a state string set in the check-in and check-out onSuccess handlers, e.g. `t("attendance.checkedIn", {name})`.
- **Fayllar:** `src/features/attendance/components/AttendanceBoard.tsx`

### `pickup-verify-error-rendered-as-expired` Any verify failure renders as a definitive DENIED with the reason "permission expired"

- **Qo'llanma:** §5.2 · **Holat:** divergent · **Hajm:** S · **Soha:** Pickup
- **Yetishmayapti:** usePickupVerify sets retry:false and neither caller reads verify.error, so on failure `data` is undefined, the denied branch renders, and PickupPage prints `verify.data?.reason ?? t("errors.PERMISSION_EXPIRED")` — a 403, a 500 or a dropped connection all display "Olib ketish ruxsati muddati tugagan". Failing closed is right; naming the wrong reason sends the operator to create a temporary permission for a call that merely timed out.
- **Tuzatish:** Branch on `verify.isError` before the denied branch in both surfaces, rendering `errorMessage(t, verify.error)` with a Retry button, and drop the PERMISSION_EXPIRED fallback so the denied branch only handles genuine `allowed === false`.
- **Fayllar:** `src/features/pickup/PickupPage.tsx`, `src/features/attendance/components/CheckOutDialog.tsx`, `src/features/pickup/api.ts`

### `pickup-temporary-grantor-not-shown` Temporary permission never shows who granted it, and check-out shows no validity window at all

- **Qo'llanma:** §5.2 · **Holat:** partial · **Hajm:** M · **Soha:** Pickup
- **Yetishmayapti:** PickupPage shows only expiresAt; CheckOutDialog — the path used from the board — shows photo, "allowed" and a name, with no permission type, window or grantor. PickupPerson carries grantedByGuardianId with no name field, PickupVerifyResult exposes neither, the persons table has no grantedBy column, and grantedByGuardianId is optional in the create schema and never read back.
- **Tuzatish:** Ask the backend to return `grantedByGuardianName` on PickupVerifyResult.person; render permissionType badge + validFrom—validTo + "Ruxsat bergan: {name}" under the name in the shared VerifyCard so both surfaces show it. Add a grantedBy column to PickupPersonsPanel and make grantedByGuardianId required in temporaryPermissionSchema.
- **Fayllar:** `src/features/pickup/PickupPage.tsx`, `src/features/attendance/components/CheckOutDialog.tsx`, `src/features/pickup/components/PickupPersonsPanel.tsx`, `src/api/types/attendance.ts`, `src/components/forms/schemas/daily.ts`

### `checkout-403-does-not-flip-the-verdict` A 403 at confirm time leaves the green ALLOWED band and an enabled Confirm

- **Qo'llanma:** §5.2 · **Holat:** partial · **Hajm:** S · **Soha:** Pickup
- **Yetishmayapti:** useCheckOut passes no onError so the failure becomes a default toast, and CheckOutDialog resets no state — the success-toned block keeps rendering and the button stays gated on the stale `allowed`. §5.2 requires a lapsed permission surfacing as 403 at that point to be handled there too; today the safety surface still reads ALLOWED after the server refused.
- **Tuzatish:** Pass an onError to checkOut.mutate that, on `isApiError(error) && (error.code === "PERMISSION_EXPIRED" || status 403)`, invalidates `qk.pickupVerify({childId, pickupPersonId})` and sets local state forcing the danger band with the server reason and the call-the-guardian next step, so the verdict flips and Confirm becomes unavailable.
- **Fayllar:** `src/features/attendance/components/CheckOutDialog.tsx`, `src/features/attendance/api.ts`

### `child-header-not-the-summary` The child profile header is not the summary — no photo, age, medical flag or debt

- **Qo'llanma:** §6.2 · **Holat:** partial · **Hajm:** M · **Soha:** Records / children
- **Yetishmayapti:** The header passes only name plus a status badge and group to PageHeader, which has no media or flag slot. Age, the red allergy flag and the debt amount live inside the Overview tab, so they are visible on arrival but below the fold on narrow screens and gone the moment the user switches tabs — the summary is tab-local instead of persistent.
- **Tuzatish:** Add src/features/children/components/ChildProfileHeader.tsx: avatar (photoFileId), name, `ageFromBirth(birthDate)`, group, ChildStatusBadge, a danger chip when alerts exist (reuse ChildRow's treatment) and a debt chip from useChildDebt gated on P.debtRead; render it in place of PageHeader in ChildDetailPage keeping the action buttons as children.
- **Fayllar:** `src/features/children/ChildDetailPage.tsx`, `src/features/children/components/ChildProfileHeader.tsx`, `src/components/common/PageHeader.tsx`, `src/features/children/components/ChildOverviewTab.tsx`

### `documents-expiring-chip-missing` No "expiring soon" chip on the Documents tab, and /documents/expiring is dead code

- **Qo'llanma:** §6.2 · **Holat:** missing · **Hajm:** S · **Soha:** Records / children
- **Yetishmayapti:** The documents TabsTrigger is a bare label; the 30-day expiry logic lives only per row inside the tab body as a module-private `expiryTone`. useExpiringDocuments is defined and called from nowhere, and `expiring`/`expiringWithin`/`expired` are translated and unused. An expiring birth certificate is invisible until the tab is opened and scanned.
- **Tuzatish:** Export expiryTone from ChildDocumentsTab, count documents expired or expiring within 30 days in ChildDetailPage (via useChildDocuments or a per-child slice of useExpiringDocuments) and render a `<Badge tone="warn">` with that count inside the documents TabsTrigger. Either wire useExpiringDocuments into it or delete the dead hook.
- **Fayllar:** `src/features/children/ChildDetailPage.tsx`, `src/features/children/components/ChildDocumentsTab.tsx`, `src/features/children/api.ts`

### `medical-editor-editable-without-write` The full medical record renders as a live editable form for medical:read-only users

- **Qo'llanma:** §6.2, §4.2 · **Holat:** partial · **Hajm:** S · **Soha:** Records / children
- **Yetishmayapti:** MedicalEditor is rendered for anyone with medical:read and consults `canWrite` in exactly one place — the submit button. Every input, the Add allergy/Add medication buttons and the per-row deletes stay enabled, so a director without medical:write gets a working form with no Save and their typed changes vanish on navigation.
- **Tuzatish:** Render a read-only presentation (definition list plus allergy/medication cards) when !canWrite, or at minimum wrap the form body in `<fieldset disabled={!canWrite}>` and hide the append/remove buttons.
- **Fayllar:** `src/features/children/components/ChildMedicalTab.tsx`

### `guardian-detail-missing-relationship-and-flags` Guardian detail lists linked children without relationship or the payer/emergency/primary flags

- **Qo'llanma:** §6.3 · **Holat:** partial · **Hajm:** S · **Soha:** Records / guardians
- **Yetishmayapti:** The linked-children table has three columns — child, group, status — because `guardiansApi.children` is typed `Child[]` and `guardiansApi.get` is `Guardian & {children?: Child[]}`, so the link fields never reach the component even though they exist on GuardianLink and are rendered from the child side. From a guardian record you cannot tell which children she pays for or whether she is the emergency contact.
- **Tuzatish:** Widen both endpoint return types to carry the link fields (`(Child & Partial<GuardianLink>)[]`), then add a Relationship column and a flags cell to GuardianDetailPage reusing the badge block from ChildGuardiansTab.
- **Fayllar:** `src/features/guardians/GuardianDetailPage.tsx`, `src/api/endpoints/guardians.ts`, `src/api/types/org.ts`

### `guardian-link-flags-not-editable` Guardian link flags cannot be edited after linking — the PATCH hook is never rendered

- **Qo'llanma:** §6.3, §7.2 · **Holat:** partial · **Hajm:** S · **Soha:** Records / guardians
- **Yetishmayapti:** useUpdateGuardianLink and childrenApi.updateGuardianLink exist and no component imports them; ChildGuardiansTab renders the flags read-only with only an Unlink action, so changing who pays or who is the primary contact means destroying and recreating the link record. The payment form defaults its payer from isPayer, so a stale flag pushes money against the wrong guardian.
- **Tuzatish:** Add a per-row edit action beside Unlink opening a FormDialog prefilled from the row, reusing guardianLinkSchema minus guardianId and submitting through useUpdateGuardianLink(childId).
- **Fayllar:** `src/features/children/components/ChildGuardiansTab.tsx`, `src/features/children/api.ts`

### `groups-capacity-bar-no-thresholds` The capacity bar never turns warning at ≥90% or danger at 100%

- **Qo'llanma:** §6.4 · **Holat:** partial · **Hajm:** S · **Soha:** Groups
- **Yetishmayapti:** ui/progress.tsx hard-codes bg-primary with no variant, and both GroupsPage and GroupDetailPage render a bare `<Progress value={percent}/>`. A group at 95% looks identical to one at 20% — exactly the read the card grid exists to give. The only signal is a full badge at 100%, with no 90% equivalent and none at all on the detail page.
- **Tuzatish:** Add an optional `tone` prop to ui/progress.tsx mapping to the --st-warn/--st-danger tokens on the indicator; pass `percent >= 100 ? "danger" : percent >= 90 ? "warn" : "ok"` on both pages and add a warn-toned "Deyarli to'lgan" badge beside the existing danger one so the state is not colour-only.
- **Fayllar:** `src/components/ui/progress.tsx`, `src/features/groups/GroupsPage.tsx`, `src/features/groups/GroupDetailPage.tsx`

### `groups-transfer-ignores-capacity-exceeded` Transfer into a full group has no override path and no "pick another group" guidance

- **Qo'llanma:** §6.4 · **Holat:** partial · **Hajm:** S · **Soha:** Groups
- **Yetishmayapti:** useTransferChild accepts a `force` flag but TransferChildDialog calls mutateAsync with no try/catch and no CAPACITY_EXCEEDED branch, so the 409 falls through to a four-word toast. A director holding group:capacity_override cannot transfer into a full group at all, and everyone else gets a dead end. Full groups are not marked in the picker either.
- **Tuzatish:** Mirror AssignChildDialog: catch CAPACITY_EXCEEDED and, when `can(P.groupCapacityOverride)`, open the shared ForceCapacityConfirm; otherwise render an inline hint under the group SelectField ("Bu guruh to'lgan — boshqa guruhni tanlang") from a new i18n key rather than a toast. Mark full groups in useGroupOptions so they are visible before submit.
- **Fayllar:** `src/features/groups/components/TransferChildDialog.tsx`, `src/features/groups/api.ts`, `src/i18n/locales/uz/people.ts`, `src/i18n/locales/ru/people.ts`

### `billing-409-already-committed-unhandled` 409 BILLING_ALREADY_COMMITTED only toasts — the screen keeps claiming nothing was charged

- **Qo'llanma:** §7.1 · **Holat:** missing · **Hajm:** S · **Soha:** Finance / billing
- **Yetishmayapti:** useCommitBilling has no onError and the run lives only in BillingPage's local useState (useBillingRun has zero call sites), so after a 409 the summary still shows the `preview` badge with Commit and Discard enabled while charges have in fact been written. The retry-lost-response case is already covered by the memoised Idempotency-Key, so this needs a second actor — but the screen is then actively false.
- **Tuzatish:** Give useCommitBilling an onError checking `isApiError(error) && error.code === "BILLING_ALREADY_COMMITTED"` that invalidates/refetches qk.billingRun(id) instead of toasting; hold only the run id in BillingPage state and read the run through useBillingRun so status, committedAt and totals re-render from the server, hiding Commit/Discard whenever status !== "preview".
- **Fayllar:** `src/features/finance/api-catalog.ts`, `src/features/finance/BillingPage.tsx`

### `billing-warnings-no-filter-link` Billing warnings are static text with no link that filters the table

- **Qo'llanma:** §7.1 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / billing
- **Yetishmayapti:** run.warnings render as plain divs with no anchor or handler and there is no filter state for run.lines. On a 200-child run the accountant must scan for tooltip icons to find the handful of warned lines, and the per-line icon carries its detail only in a `title` attribute (its aria-label is the generic word "Ogohlantirishlar"), so the text is mouse-only.
- **Tuzatish:** Add `warnedOnly` state to BillingRunTab, render a button inside the warnings card ("N ta qatorni ko'rsatish") that sets it, filter the lines map on `!warnedOnly || l.warnings?.length`, and show a clear affordance while active. Replace the title tooltip with the Radix Tooltip primitive or an inline warning chip.
- **Fayllar:** `src/features/finance/BillingPage.tsx`

### `billing-commit-confirm-omits-totals` The commit confirmation states a child count but never the money total

- **Qo'llanma:** §7.1 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / billing
- **Yetishmayapti:** The dialog passes only {period, count} and the copy says "bu amal bir marta bajariladi" — the action runs once, not that the batch is irreversible. `run.totalTiyin` is on the summary card and never reaches the dialog, so the single number that would catch a mis-configured rules version before it is written is absent. No reason is captured either.
- **Tuzatish:** Extend `billing.commit.text` in both finance.ts catalogues to interpolate `{{total}}` and to state that committed charges can only be undone one-by-one via charge reversal; pass `total: formatTiyin(run.totalTiyin)` alongside period and count, and add `requireReason reasonMinLength={10}` to match the tier-3 definition.
- **Fayllar:** `src/features/finance/BillingPage.tsx`, `src/i18n/locales/uz/finance.ts`, `src/i18n/locales/ru/finance.ts`

### `billing-simulate-no-side-by-side-diff` Simulate shows one bare number — no comparison against the active rules, no trace

- **Qo'llanma:** §7.1 · **Holat:** partial · **Hajm:** M · **Soha:** Finance / billing
- **Yetishmayapti:** The simulate result renders only `<Money value={amountTiyin}/>`; SimulateBillingResult.trace is never rendered, and nothing anywhere computes two results to compare — RulesDiffDialog diffs rule configuration and dumps the raw response into a `<pre>` (RulesDiffDialog.tsx is 47 lines; the `<pre>` is at :40-42). An accountant cannot see "this child goes from 1 200 000 to 1 080 000", which is the point of the step.
- **Tuzatish:** Fire two useSimulateBilling calls for the chosen child+month — one with the draft rules, one without — and render them side by side with the delta highlighted, plus the returned trace using the table already built in BillingExplainDialog.tsx:60-81 (extract it as a shared BillingTraceTable). Render RulesDiffDialog's payload as a field-by-field two-column diff instead of JSON.stringify.
- **Fayllar:** `src/features/finance/components/BillingRulesTab.tsx`, `src/features/finance/components/RulesDiffDialog.tsx`, `src/features/finance/components/BillingExplainDialog.tsx`

### `payment-payer-guardian-not-defaulted` The payer picker is tenant-wide and does not default to the child's isPayer guardian

- **Qo'llanma:** §7.2 · **Holat:** partial · **Hajm:** M · **Soha:** Finance / payments
- **Yetishmayapti:** PaymentFormDialog mounts GuardianPicker with no default and no child scoping, and GuardianPicker queries guardiansApi.list tenant-wide — so the form offers every guardian in the tenant and the isPayer flag, which is badged on the guardians tab, is invisible here. It is optional payer metadata rather than the ledger anchor, but a receipt can still name an unrelated family's guardian.
- **Tuzatish:** Call useChildGuardians(selectedChild) and replace the global picker with a child-scoped variant (EntityPicker's ChildPicker already accepts groupId, mirror that with a childId prop) listing only that child's links with the isPayer one badged; add an effect setting `payerGuardianId` to the isPayer link whenever childId changes.
- **Fayllar:** `src/features/finance/components/PaymentFormDialog.tsx`, `src/components/common/EntityPicker.tsx`

### `payment-advance-credit-unnamed-in-fifo` Advance credit is only quantified when manual allocation is switched on

- **Qo'llanma:** §7.2, §12 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / payments
- **Yetishmayapti:** The only place `payments.form.toAdvance` renders with a figure is inside PaymentAllocations, which mounts only when `manual && selectedChild`. In the default FIFO path reception uses, entering 500 000 against 300 000 of open charges gives no indication that 200 000 becomes credit — the static hint mentions advance credit in words only.
- **Tuzatish:** Extract the open-charge remainder maths from PaymentAllocations into `useOpenChargeTotal(childId)` and, when a child is selected and manual is off, render a one-line info row under the FIFO hint: amount − open charges → "X so'm avans sifatida qoladi".
- **Fayllar:** `src/features/finance/components/PaymentFormDialog.tsx`, `src/features/finance/components/PaymentAllocations.tsx`

### `debts-per-child-card-incomplete` The per-child debt card shows 2 of 6 figures and no ageing bar

- **Qo'llanma:** §7.3 · **Holat:** partial · **Hajm:** M · **Soha:** Finance / debts
- **Yetishmayapti:** ChildDebt carries currentCharge, previousDebt, totalPaid, advanceBalance, currentDebt, overdueAmount and ageing and useChildDebt fetches all of it, but ChildOverviewTab renders only currentDebt and advanceBalance — while `debts.card.currentCharge/previousDebt/totalPaid/overdueAmount/ageing` are already translated and unused. Nobody can see how a child's debt was arrived at, which is the conversation reception has with a parent.
- **Tuzatish:** Build a ChildDebtCard in features/finance/components consuming useChildDebt: five money rows using the existing debts.card.* keys plus a stacked ageing bar (four flex divs sized by share, st-neutral/st-warn/st-danger tokens). Render it in ChildOverviewTab in place of the two-figure block and reuse it as an expandable row detail on DebtsPage.
- **Fayllar:** `src/features/children/components/ChildOverviewTab.tsx`, `src/features/finance/components/ChildDebtCard.tsx`, `src/features/finance/DebtsPage.tsx`

### `expenses-summary-not-a-chart` The yearly expense summary is an undifferentiated tile grid, not a chart

- **Qo'llanma:** §7.6 · **Holat:** partial · **Hajm:** M · **Soha:** Finance / expenses
- **Yetishmayapti:** summary.data maps to bordered divs with a label and a Money value, so a 40 000 000 row and a 400 000 row look identical and the comparison the summary exists to make is not made. The label is also ambiguous by construction (`row.type ? … : row.month`), so the code does not commit to a by-month or by-type view.
- **Tuzatish:** recharts ^2.15.4 is already a dependency and src/components/ui/chart.tsx is a ready shadcn wrapper imported by nothing — use it, or a simple sorted horizontal bar list scaled by share of max with right-aligned tabular-nums labels. Add a by-month / by-type toggle if the endpoint returns both groupings.
- **Fayllar:** `src/features/expenses/ExpensesPage.tsx`, `src/components/ui/chart.tsx`

### `announcements-no-live-recipient-count` No live recipient count anywhere in the announcement flow

- **Qo'llanma:** §8.1 · **Holat:** missing · **Hajm:** M · **Soha:** Communication / announcements
- **Yetishmayapti:** The compose dialog gives no feedback about blast radius and Publish is a single-click mutate with no confirmation, so `audienceType: "all"` reaches every guardian in the tenant in one click with no number shown. `recipientCount` exists on the type with zero usages and `announcements.columns.recipients` is translated and unrendered.
- **Tuzatish:** Add `useAudienceCount(audienceType, audienceIds)` in comms/api.ts resolving from existing list endpoints' `meta.total` (children/guardians/users with limit:1 — no new server endpoint) and render "≈ N qabul qiluvchi" under the audience picker; render announcement.recipientCount in a Recipients column using the existing key; wrap Publish in the already-imported ConfirmDialog naming the audience and the count.
- **Fayllar:** `src/features/comms/AnnouncementsPage.tsx`, `src/features/comms/api.ts`, `src/i18n/locales/uz/comms.ts`, `src/i18n/locales/ru/comms.ts`

### `announcements-specific-audience-not-selectable` children / guardians / staff audiences cannot be narrowed to specific people

- **Qo'llanma:** §8.1 · **Holat:** partial · **Hajm:** M · **Soha:** Communication / announcements
- **Yetishmayapti:** The id picker renders only for `audienceType === "group"` and is single-select; choosing children, guardians or staff leaves audienceIds empty so the request targets the whole class. The DTO and schema both accept an array and the "Aniq qabul qiluvchilar" label already exists — "specific children" is simply not expressible, nor is a multi-group announcement.
- **Tuzatish:** Replace the single SelectField with a per-audience-type multi-select branch reusing ChildPicker/GuardianPicker (plus a user picker for staff) in the `multiple` mode added for bulk sending, accumulating into audienceIds and showing selections as removable chips so the count is visible.
- **Fayllar:** `src/features/comms/AnnouncementsPage.tsx`, `src/components/common/EntityPicker.tsx`

### `announcements-attachments-missing` `fileIds` is declared and always posts empty — there is no way to attach a file

- **Qo'llanma:** §8.1, §4.4 · **Holat:** missing · **Hajm:** S · **Soha:** Communication / announcements
- **Yetishmayapti:** fileIds is set once in the form defaults and never written again; there is no upload control in the dialog and no attachment affordance on the list rows, though FileUploadField is wired in five other features and `announcements.form.files` is translated and unused. An announcement can never carry a menu, a permission slip or a photo.
- **Tuzatish:** Add `<FileUploadField>` after the body textarea wired to `setValue("fileIds", ids)` with the existing label key, and render attachments on the row through the authed FileLink/filesApi.download helper, never a bare href.
- **Fayllar:** `src/features/comms/AnnouncementsPage.tsx`, `src/components/common/FileUploadField.tsx`, `src/i18n/locales/uz/comms.ts`, `src/i18n/locales/ru/comms.ts`

### `templates-uz-ru-not-side-by-side` uz and ru bodies are stacked vertically at 3 rows each

- **Qo'llanma:** §8.2 · **Holat:** partial · **Hajm:** S · **Soha:** Communication / templates
- **Yetishmayapti:** TemplatesTab stacks bodyUz directly above bodyRu inside a space-y-3 column, so the two languages are never in the same horizontal band and divergence is invisible on anything but the shortest template. §8.2 opens by singling this screen out as the one place two columns beat tabs.
- **Tuzatish:** Wrap the two Fields in `<div className="grid gap-3 md:grid-cols-2">` and raise rows to 6 so the bodies line up; keep uz first per AGENTS.md.
- **Fayllar:** `src/features/comms/components/TemplatesTab.tsx`

### `templates-preview-has-no-sample-data` The server preview is fed placeholder braces instead of sample values

- **Qo'llanma:** §8.2 · **Holat:** partial · **Hajm:** S · **Soha:** Communication / templates
- **Yetishmayapti:** runPreview builds sampleData as `[variable, "{variable}"]`, so the correct server round-trip renders the braces straight back and money formatting, name length and line breaks stay invisible. `templates.sampleData` ("Namuna qiymatlar") is translated and unused, and the two outputs are printed unlabelled.
- **Tuzatish:** Add a sample-values panel (one Input per entry in draft.variables, using the existing sampleData key) seeded with realistic defaults — child "Alisher Karimov", amount "450 000", time "07:52" — pass those to preview.mutate, and label the two outputs with the existing bodyUz/bodyRu keys.
- **Fayllar:** `src/features/comms/components/TemplatesTab.tsx`, `src/features/comms/api.ts`, `src/i18n/locales/uz/comms.ts`, `src/i18n/locales/ru/comms.ts`

### `delivery-log-no-date-filter` The delivery log filters by channel and status but not by date

- **Qo'llanma:** §8.3 · **Holat:** partial · **Hajm:** S · **Soha:** Communication / delivery log
- **Yetishmayapti:** NotificationsPage holds only channel/status/page and the FilterBar has two SelectFields, though NotificationListParams and the OpenAPI endpoint both declare `from`/`to` (and `recipientId`). Answering "did last night's debt reminders go out?" means paging back through a 50-per-page list with no way to bound it to a day.
- **Tuzatish:** Add two DateFields following the AuditPage pattern, backed by useStickyState and defaulting to the last 7 days, and pass from/to into the useNotifications params.
- **Fayllar:** `src/features/comms/NotificationsPage.tsx`

### `dashboard-tile-set-incomplete` Director lacks attendance rate and revenue-vs-expected; reception lacks present-today and the pickup queue — and one tile is mislabelled

- **Qo'llanma:** §9.1 · **Holat:** partial · **Hajm:** M · **Soha:** Dashboards
- **Yetishmayapti:** §9.1's per-role tile lists are unmet for two of three roles (accountant is complete). Separately the reception tile showing `unboundGuardianCount` is labelled `dashboard.tiles.telegramBound` ("Telegramga ulangan"), so it reads as the bound count while showing the unbound one. `dashboard.tiles.presentToday` and `dashboard.tiles.pendingPickups` are already translated and unused.
- **Tuzatish:** Fix the mislabel first. Add a director attendance-rate tile computed as `1 - absentToday/activeChildren` linking to /davomat, and a reception present-today tile using the existing key. Revenue-vs-expected and the pickup queue need server fields — add `chargedThisMonthTiyin` to DirectorDashboard and `pickupQueueCount` to ReceptionDashboard and raise them with the backend rather than fanning out to extra endpoints.
- **Fayllar:** `src/features/dashboard/components/DashboardViews.tsx`, `src/api/types/system.ts`

### `audit-missing-user-and-entity-id-filters` Audit filters cover entity, action and dates but not user or entity id, and entity/action are free text

- **Qo'llanma:** §9.3 · **Holat:** partial · **Hajm:** S · **Soha:** Insight / audit
- **Yetishmayapti:** Two of the five §9.3 filters are absent although AuditListParams and the API both declare entityId and userId — and userName is shown in the table but cannot be filtered on. entity and action are free-text inputs, so a typo returns an empty list indistinguishable from "no activity", and no Clear-filters affordance is passed to FilterBar.
- **Tuzatish:** Add an entityId Input and a user picker (over the users list) bound to useStickyState and passed into the params; turn entity and action into SelectFields over the known enum values so a typo cannot produce a silent empty result; pass activeCount and onReset to the existing FilterBar.
- **Fayllar:** `src/features/audit/AuditPage.tsx`, `src/api/endpoints/admin.ts`

---

## Past daraja

### `matrix-deprecated-toggle-missing` No deprecated-permissions toggle; the flag is never read

- **Qo'llanma:** §10.2 · **Holat:** missing · **Hajm:** S · **Soha:** Administration / roles
- **Yetishmayapti:** `Permission.deprecated` exists and "Eskirgan"/"Устарело" are translated, but no component reads the flag and MatrixPermission does not carry it — so deprecated keys are indistinguishable from live ones and an operator can grant a scope on a retired permission. The label was written for a control that was never built.
- **Tuzatish:** Reuse the permission catalogue fetched for the allowedScopes fix: add `showDeprecated` state, exclude deprecated keys unless it is on, render a `<Switch>` in the filter card with the existing roles.matrix.deprecated key, and style shown deprecated rows muted/struck.
- **Fayllar:** `src/features/users/components/PermissionMatrix.tsx`, `src/api/types/admin.ts`

### `matrix-clone-not-in-column-header` Clone is only on the roles list tab, not beside each matrix column header

- **Qo'llanma:** §10.2 · **Holat:** partial · **Hajm:** S · **Soha:** Administration / roles
- **Yetishmayapti:** CloneRoleDialog is fully implemented but mounted only in the list row actions; the matrix column header holds just the role name, a protected badge and Save. The matrix is where an operator realises "this is nearly what I want", and switching tabs to clone breaks that. Purely placement — the dialog exists.
- **Tuzatish:** Import CloneRoleDialog into PermissionMatrix and render it beside Save in each column header; it takes a `Role` while the matrix has a `MatrixRole`, so either widen the prop to `Pick<Role,"id"|"code"|"nameUz"|"nameRu">` or look the role up from useRoles() by id.
- **Fayllar:** `src/features/users/components/PermissionMatrix.tsx`, `src/features/users/components/RoleDialogs.tsx`

### `working-days-hours-no-downstream-note` The attendance/billing consequence is stated only inside the add-holiday dialog

- **Qo'llanma:** §10.3 · **Holat:** partial · **Hajm:** S · **Soha:** Administration / settings
- **Yetishmayapti:** `settings.holidays.hint` ("these days change the working-day count in attendance and billing") is good copy with a single usage — as the create dialog's description. The holidays table itself carries no such note, and the General tab's working-days chips and open/close fields have no hint at all, so un-ticking Saturday silently changes proration for every child in the next run.
- **Tuzatish:** Add a `settings.form.workingDaysHint` key to both system.ts catalogues with the same wording, render it under the working-days block and on the open/close Fields via the `hint` prop the phones field already uses, and surface settings.holidays.hint as a persistent line above the holidays table.
- **Fayllar:** `src/features/settings/SettingsPage.tsx`, `src/features/settings/components/HolidaysTab.tsx`, `src/i18n/locales/uz/system.ts`, `src/i18n/locales/ru/system.ts`

### `website-admin-module-absent` No Website entry in the Admin nav and no landing editor — the public site is compile-time constants

- **Qo'llanma:** §10.5, §3.1 · **Holat:** missing · **Hajm:** L · **Soha:** Administration / website
- **Yetishmayapti:** The admin section lists only Users/Roles/Settings/Imports/Audit, there is no /sayt route, and features/landing makes zero network calls — the phone number, social links, anchors and marquee items are constants, so changing the site phone requires a redeploy. Reported as documentation rather than a defect: there is no landing permission key and openapi.json exposes nothing under /landing, /website or /pages, §10.5 defers to a separate design guide not supplied here, and §11 puts Website last in the build order.
- **Tuzatish:** Confirm with the backend whether a website module is planned. If yes: add a P.websiteManage key, a /sayt route, a src/features/website/ feature with the draft/live split, the nav entry, and convert landing/constants.ts into the seed payload with the constants kept as SSR fallback. If not, record the deviation in REFACTOR-NOTES.md so future audits do not re-raise it.
- **Fayllar:** `src/config/navigation.ts`, `src/config/permissions.ts`, `src/features/landing/constants.ts`, `REFACTOR-NOTES.md`

### `tabular-nums-only-on-money` tabular-nums is on money but not on other numeric columns

- **Qo'llanma:** §2.3 · **Holat:** partial · **Hajm:** S · **Soha:** Design foundations
- **Yetishmayapti:** §2.3 asks for tabular-nums on any tabular number. Neither TableCell nor TableHead carries it, so date and time columns render with proportional Montserrat digits — a column of dd.MM.yyyy is visibly ragged and the polled attendance counters jitter in width on each refresh.
- **Tuzatish:** Add tabular-nums to the TableCell base class in ui/table.tsx (harmless on text cells) or introduce `<DateText>`/`<TimeText>` wrappers carrying it, and add it to the attendance board counter values.
- **Fayllar:** `src/components/ui/table.tsx`, `src/features/attendance/components/AttendanceBoard.tsx`, `src/features/finance/PaymentsPage.tsx`

### `dashboard-nav-placement` Dashboard sits in a one-item section instead of Insight with Reports

- **Qo'llanma:** §3.1 · **Holat:** divergent · **Hajm:** S · **Soha:** App shell
- **Yetishmayapti:** §3.1 groups Insight = Dashboard · Reports; navigation.ts puts /boshqaruv alone under nav.sections.main and leaves nav.sections.analytics holding only /hisobotlar, so the user sees two groups of one.
- **Tuzatish:** Either move /boshqaruv into the analytics section and delete the empty main section, or render it outside the section list entirely as a pinned home item so "Asosiy" does not read as a group — and record the pinned-home choice in AGENTS.md if kept.
- **Fayllar:** `src/config/navigation.ts`, `src/i18n/locales/uz/app.ts`, `AGENTS.md`

### `sidebar-breakpoints-divergent` Sidebar drawer starts at 1024px instead of 768px

- **Qo'llanma:** §3.2 · **Holat:** divergent · **Hajm:** S · **Soha:** App shell
- **Yetishmayapti:** The aside is `hidden lg:flex` so 768-1024px gets the hamburger drawer where the guide asks for a collapsed icon rail — a 900px tablet, a plausible reception device, loses the sidebar entirely. Collapse is a persisted user toggle with Ctrl+B and tooltips rather than breakpoint-driven hover-expand, which is otherwise better-behaved than the spec.
- **Tuzatish:** Change the aside to `hidden md:flex` and have useSidebar default `collapsed` to true below 1280px on first load when nothing is stored, keeping an explicit user choice authoritative once set; optionally add hover:w-72 on the collapsed rail. The drawer then matches the guide below 768px.
- **Fayllar:** `src/components/layout/AppShell.tsx`, `src/hooks/use-sidebar.ts`

### `scope-never-read-by-features` No `useScope` hook; scopeOf, scopeWeight and isWideScope are dead API surface

- **Qo'llanma:** §4.1 · **Holat:** partial · **Hajm:** S · **Soha:** Cross-cutting / permissions
- **Yetishmayapti:** §4.1 names `useScope('child:read') → all|branch|own_group|…` as a first-class hook; it does not exist, and scopeOf/scopeWeight/isWideScope have zero call sites. Consequence is narrow — scopes are enforced server-side and the attendance group filter already renders (it is simply not scope-defaulted).
- **Tuzatish:** Export `useScope(key): Scope | undefined` from auth-context.ts as a memoised wrapper over scopeOf, and use it to default and lock the group filter in AttendanceBoard when the attendance scope is own_group. Delete scopeWeight and isWideScope from config/permissions.ts if no consumer is planned rather than leaving dead surface.
- **Fayllar:** `src/auth/auth-context.ts`, `src/config/permissions.ts`, `src/features/attendance/components/AttendanceBoard.tsx`

### `attendance-corrections-not-on-child-day-detail` Corrections live in the journal tab; the child's calendar has no day detail

- **Qo'llanma:** §5.1 · **Holat:** partial · **Hajm:** M · **Soha:** Attendance
- **Yetishmayapti:** CorrectionDialog is mounted only as a row action in the attendance Journal, and ChildAttendanceTab renders each day as a non-interactive div with a title tooltip. Both hard requirements are met (≥10-char reason, never inline on the board) but §5.1 places the entry point on the child's day detail — so fixing one child's Tuesday means leaving the profile and re-filtering the journal.
- **Tuzatish:** Make the calendar cells buttons opening a small day-detail popover (status, check-in, check-out, picked up by) with a "Yozuvni tuzatish" action rendering the existing CorrectionDialog. This needs the record id — either add `id` to AttendanceCalendarDay or look the day up via useAttendanceList({childId, from, to}).
- **Fayllar:** `src/features/children/components/ChildAttendanceTab.tsx`, `src/features/attendance/components/AttendanceJournal.tsx`, `src/api/types/attendance.ts`

### `row-click-not-navigating` Directory rows are not clickable as a whole

- **Qo'llanma:** §6.1 · **Holat:** partial · **Hajm:** S · **Soha:** Records / children
- **Yetishmayapti:** The TableRow has hover styling that suggests clickability but no onClick and no row-level link; navigation is the name link plus an eye button that sits at 60% opacity until hover or focus-within — which on a tablet, where there is no hover, is the harder problem. §6.1 asks for row click → profile.
- **Tuzatish:** Add an onClick on the TableRow navigating to /bolalar/$id while ignoring clicks inside the trailing actions cell (`event.target.closest('[data-row-actions]')`), keep the name link for keyboard users, and drop the hover-gated opacity on the eye button at touch widths.
- **Fayllar:** `src/features/children/components/ChildRow.tsx`

### `status-reason-optional` The status-change reason is optional, so history entries can land unexplained

- **Qo'llanma:** §6.2 · **Holat:** partial · **Hajm:** S · **Soha:** Records / children
- **Yetishmayapti:** childStatusSchema types reason as optionalText, the dialog seeds it undefined and the field carries no required marker, so a child can be moved to withdrawn or suspended with an empty reason and the History timeline shows a bare from→to. §6.2 says the action needs an effective date and a reason.
- **Tuzatish:** Make reason a required min-length text in childStatusSchema — at minimum via a superRefine for suspended/withdrawn/graduated/archived — and mark the field required in ChildStatusDialog.
- **Fayllar:** `src/components/forms/schemas/people.ts`, `src/features/children/components/ChildStatusDialog.tsx`

### `status-action-gated-behind-edit-permission` The status action is nested inside the edit-permission check

- **Qo'llanma:** §6.2, §4.1 · **Holat:** partial · **Hajm:** S · **Soha:** Records / children
- **Yetishmayapti:** ChildDetailPage renders the status dialog only inside `canManage = canAny(childCreate, childUpdate)`, and ChildStatusDialog is mounted nowhere else — so a user holding child:status alone has no path to the action it governs.
- **Tuzatish:** Restructure the header children so the status dialog sits under its own can(P.childStatus) check and the edit dialog under canManage, with the wrapper shown when either is true.
- **Fayllar:** `src/features/children/ChildDetailPage.tsx`

### `payer-not-visually-prominent` The PAYER badge has the same weight as the other two link flags

- **Qo'llanma:** §6.3 · **Holat:** partial · **Hajm:** S · **Soha:** Records / guardians
- **Yetishmayapti:** isPayer/isPrimaryContact/isEmergencyContact all render through the same BASE badge class differing only in tone, so payer reads as one chip among three — but it is the flag that decides where money is applied, and §6.3 says make it prominent.
- **Tuzatish:** Give the payer badge extra weight (font-bold uppercase tracking-wide plus a Wallet icon) and sort it first in the flags cell; leave the other two unchanged.
- **Fayllar:** `src/features/children/components/ChildGuardiansTab.tsx`, `src/components/common/StatusBadge.tsx`

### `unbound-count-not-surfaced` The unbound-guardian count is not shown as a number on the list

- **Qo'llanma:** §6.3 · **Holat:** partial · **Hajm:** S · **Soha:** Records / guardians
- **Yetishmayapti:** TelegramPanel's CardTitle carries no count although the data is in hand one line above; the panel sits below the table and pagination and is hidden entirely from users without guardian:manage. Unbound guardians silently miss every notification, so the aggregate has to be counted by eye.
- **Tuzatish:** Render `<Badge tone="warn">{unbound.data?.length ?? 0}</Badge>` in the panel title and surface the same number near the page header as a clickable warn chip that scrolls to the panel.
- **Fayllar:** `src/features/guardians/components/TelegramPanel.tsx`, `src/features/guardians/GuardiansPage.tsx`

### `groups-assign-transfer-reason` Assign collects no reason and the transfer reason is optional

- **Qo'llanma:** §6.4 · **Holat:** partial · **Hajm:** S · **Soha:** Groups
- **Yetishmayapti:** assignChildSchema has only childId and effectiveDate, and transferChildSchema types reason as optionalText so it submits empty — yet the group History tab prints a reason column and falls back to the bare action. Half of this is not fixable in the frontend: AssignChildDto has no reason field at all, so assign needs a contract change first; TransferChildDto does carry `reason?`.
- **Tuzatish:** Tighten transferChildSchema.reason to requiredText() now. For assign, request `reason` on AssignChildDto, then add it to assignChildSchema and a Textarea beside the effective-date field in AssignChildDialog.
- **Fayllar:** `src/components/forms/schemas/people.ts`, `src/features/groups/components/TransferChildDialog.tsx`, `src/features/groups/components/AssignChildDialog.tsx`, `src/api/types/org.ts`

### `billing-preview-banner-is-a-page-subtitle` "Nothing has been charged yet" is page chrome and stays visible after commit

- **Qo'llanma:** §7.1 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / billing
- **Yetishmayapti:** The copy is passed as the PageHeader subtitle, so it renders as muted grey text outside the Tabs — visible on the Rules tab too — and is unconditional on run status, meaning it keeps asserting nothing is written after the badge flips to committed. §7.1 asks for a persistent info-toned banner attached to the preview.
- **Tuzatish:** Move the copy into BillingRunTab as an info-toned banner (border-st-info-border bg-st-info-soft, mirroring the existing warning banner) directly above the summary cards, conditional on `run?.status === "preview"`, and add a committed banner stating what was written and when.
- **Fayllar:** `src/features/finance/BillingPage.tsx`

### `billing-idempotency-minted-at-commit-click` The billing Idempotency-Key is minted at the commit click, not when the preview opened

- **Qo'llanma:** §7.1, §4.3 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / billing
- **Yetishmayapti:** The preview's onSuccess calls idempotency.reset(), nulling the ref, so get() inside the commit onConfirm is the first call that mints a key. Retry safety is intact because get() memoises until the next reset — this is a deviation from the stated contract (and from PaymentFormDialog, which mints on open) rather than a live defect.
- **Tuzatish:** Change the preview onSuccess to reset then immediately get() — or add a `renew()` to lib/idempotency.ts that does both — so the key demonstrably belongs to the preview, keeping the reset-after-commit-success as is.
- **Fayllar:** `src/features/finance/BillingPage.tsx`, `src/lib/idempotency.ts`

### `charges-kind-filter-and-year-missing` The charge kind filter is absent and the period dropdown only offers the current year

- **Qo'llanma:** §7.4 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / charges
- **Yetishmayapti:** ChargeListParams declares `kind` and `charges.filters.kind` is translated, but the FilterBar has three controls and never sends it. Separately `usePeriods(currentPeriod().year)` hard-codes the year, so an accountant reconciling a prior year cannot reach those periods at all.
- **Tuzatish:** Add a kind SelectField backed by useStickyState and passed into useCharges, sourcing options from the tariff kinds list; add a year input feeding usePeriods(year) so older periods are selectable.
- **Fayllar:** `src/features/finance/ChargesPage.tsx`

### `periods-no-year-view` Periods is a sparse table, not a year of twelve month cards

- **Qo'llanma:** §7.5 · **Holat:** partial · **Hajm:** M · **Soha:** Finance / periods
- **Yetishmayapti:** §7.5 asks for twelve month cards, each open (success) or closed (muted with a lock icon), the current period anchored and closed periods linking to their reports. Instead it is a five-column table of only the rows the server returns, the lock icon is on the Close button rather than the state, currentPeriod() is never compared to a row, and a closed period is a dead end. No workflow is blocked — the header has a month select and "Davr ochish".
- **Tuzatish:** Replace the table with a `grid sm:grid-cols-3 lg:grid-cols-4` of twelve cards built from Array.from({length:12}) joined against the fetched periods by month, so unopened months render as an empty card with the existing open action; mute closed cards with a Lock icon, ring the current period, and add a `<Link to="/hisobotlar" search={{period: period.id}}>` on closed cards.
- **Fayllar:** `src/features/finance/PeriodsPage.tsx`

### `periods-close-no-content-summary` The close-period dialog does not summarise what the period contains

- **Qo'llanma:** §7.5 · **Holat:** partial · **Hajm:** S · **Soha:** Finance / periods
- **Yetishmayapti:** The description names the period and the consequence — meeting the tier-2 baseline — but §7.5 asks for a summary of the contents, so the accountant seals a month without seeing its charge count and total, payments received or outstanding debt. It is also flagged `sensitive`, rendering the tier-3 audit banner on an action the guide places at tier 2.
- **Tuzatish:** Fetch the period's contents for the row being closed with the existing hooks (useCharges({periodId, limit:1}) for meta.total plus the ChargesPage totals pattern, useDebtSummary for outstanding) and render them as a small definition list inside the ConfirmDialog description, which already accepts ReactNode. Drop `sensitive` from close, leaving it on reopen.
- **Fayllar:** `src/features/finance/PeriodsPage.tsx`, `src/i18n/locales/uz/finance.ts`, `src/i18n/locales/ru/finance.ts`

### `expenses-month-filter-missing` Expenses filter by year/type/status but not month

- **Qo'llanma:** §7.6 · **Holat:** missing · **Hajm:** S · **Soha:** Finance / expenses
- **Yetishmayapti:** ExpenseListParams supports `month` and expensesApi.list forwards params wholesale, but the page passes year/type/status only, so a bookkeeper reconciling a single month must scan the whole year.
- **Tuzatish:** Add a month SelectField to the FilterBar using the twelve-option periodLabel pattern from BillingPage, back it with useStickyState("expenses.month","all") and pass `month` into useExpenses.
- **Fayllar:** `src/features/expenses/ExpensesPage.tsx`

### `announcements-emergency-not-alarming` Priority only tints a badge — emergency looks the same as low

- **Qo'llanma:** §8.1 · **Holat:** partial · **Hajm:** S · **Soha:** Communication / announcements
- **Yetishmayapti:** The TableRow carries no priority-dependent class, so a low row and an emergency row are pixel-identical apart from a small badge, and in the composer nothing reacts to the priority selection. §8.1 asks priority to change visual weight in lists and emergency to look alarming in composition.
- **Tuzatish:** Give the row a priority-driven class (border-l-4 border-st-danger plus a bolder title for emergency, st-warn for high) and, when the watched priority is emergency, render a danger-toned Alert above the dialog fields stating it will go out as an emergency.
- **Fayllar:** `src/features/comms/AnnouncementsPage.tsx`

### `templates-variables-not-insertable-chips` Available variables are a comma-separated input, not insertable chips

- **Qo'llanma:** §8.2 · **Holat:** partial · **Hajm:** S · **Soha:** Communication / templates
- **Yetishmayapti:** Variables are edited as one Input that splits on commas, with a hint telling the editor to type them by hand — there is no chip list and no way to click a variable into either body, which is the direct cause of the parity problem filed separately.
- **Tuzatish:** Render draft.variables as a row of badge-shaped buttons above the two textareas that insert `{variable}` at the caret of the last-focused textarea (tracked with a ref), keeping the raw input behind a small "edit variables" disclosure.
- **Fayllar:** `src/features/comms/components/TemplatesTab.tsx`

### `delivery-log-no-per-attempt-detail` Attempt history is fetchable but never shown — only a count and the last error

- **Qo'llanma:** §8.3 · **Holat:** partial · **Hajm:** S · **Soha:** Communication / delivery log
- **Yetishmayapti:** The row shows attemptCount and lastError with no drill-in; useNotification has zero call sites and `notifications.detail.title/attempts/lastError/body` are translated and unused, though NotificationAttempt carries {at, status, error}. When a send fails repeatedly the operator sees `3` and one string.
- **Tuzatish:** Add a detail dialog (row click or eye button, mirroring the AuditPage pattern) driven by the existing useNotification hook, listing attempts with time, status and error plus the rendered body, using the already-translated detail keys.
- **Fayllar:** `src/features/comms/NotificationsPage.tsx`, `src/features/comms/api.ts`

### `dashboard-tiles-have-no-trend` No tile carries a trend or sparkline

- **Qo'llanma:** §9.1 · **Holat:** missing · **Hajm:** S · **Soha:** Dashboards
- **Yetishmayapti:** StatCard's props are {icon, label, value, tone, to} and none of the 16 tiles passes a comparison figure — 450 000 000 with no direction is the "dashboards that need interpretation" failure §9.1 warns about. Primarily a backend gap: the three dashboard payloads carry no prior-period fields, so the only trend derivable client-side today is the director's attendance rate.
- **Tuzatish:** Add an optional `trend?: {value, direction, label}` prop to StatCard rendering an arrow plus delta under the value with st-ok/st-danger tokens, keeping the arrow and word so it is never colour alone; request revenuePrevMonthTiyin / debtPrevTiyin / activeChildrenPrevMonth on the payloads.
- **Fayllar:** `src/features/dashboard/components/StatCard.tsx`, `src/features/dashboard/components/DashboardViews.tsx`, `src/api/types/system.ts`

### `dashboard-states-not-per-tile` Loading / error / empty are panel-level, never per tile

- **Qo'llanma:** §9.1 · **Holat:** partial · **Hajm:** S · **Soha:** Dashboards
- **Yetishmayapti:** Each view wraps its whole grid in one QueryState, so an error replaces every tile, and no tile has an empty treatment — the open-period tile renders a bare "—" when there is no open period, which reads as broken. Panel-level loading is defensible given the one-aggregate-call rule.
- **Tuzatish:** Add an `empty?: string` prop to StatCard rendering muted explanatory text in place of the value, and use it wherever a field can legitimately be null or zero, starting with the open-period tile.
- **Fayllar:** `src/features/dashboard/components/StatCard.tsx`, `src/features/dashboard/components/DashboardViews.tsx`
