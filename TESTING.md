# Homebase OS — Manual QA Checklist

End-to-end manual test flow for the Expo frontend. Run this against a local
backend (`homebase-be`) with the demo data seeded:

```sh
# backend (once)
python manage.py seed_demo_rental
# backend (serving)
python manage.py runserver
# frontend
npm run start
```

Demo accounts (from `seed_demo_rental`):

| Role    | Email                    | Password       |
| ------- | ------------------------ | -------------- |
| Owner   | `demo.owner@homebase.test` | `Homebase123!` |
| Tenant  | `demo.tenant@homebase.test` | `Homebase123!` |

> Automated unit tests cover a subset of these flows (`npm run test`). See
> [Automated tests](#automated-tests) at the bottom.

---

## 1. Account creation & auth
- [ ] Signup with valid email + strong password → success, auto-logged in, lands on Home
- [ ] Signup rejects: invalid email, weak/short password, mismatched confirm password
- [ ] Signup with an already-registered email → friendly error, no crash
- [ ] Login with correct creds → lands on Home with your assets
- [ ] Login with wrong password / unknown email → clear error
- [ ] Logout → back to login screen
- [ ] Kill & relaunch the app → still logged in (token persisted)
- [ ] Log in as tenant, log out, log in as owner → correct account + correct data (no cross-account leakage)

## 2. Asset creation (Registered Assets)
- [ ] Create a **rental unit** → `rent_amount` required, currency defaults to UGX
- [ ] Create a **construction site** (name, location, budget)
- [ ] Create a **household/estate** asset
- [ ] Submit with required fields empty → validation message, no create
- [ ] After create: asset shows in list with `my_role: OWNER` and write access to ledger

## 3. Home context behavior
- [ ] New user with no assets → empty state / create-asset prompt (no crash)
- [ ] Rental asset selected → Portfolio ledger strip shows balance + "Portfolio A/R Ledger"
- [ ] Construction asset selected → Genesis workspace loads
- [ ] Household/estate selected → Resident Command + Health Services + Trust Center buttons appear
- [ ] Search bar placeholder changes per asset type

## 4. Rental workspace — owner
- [ ] Ledger Balance + Yield Collected cards show real numbers
- [ ] **+ New Lease** with tenant email `demo.tenant@homebase.test` → success message, lease is **active**, tenant granted access
- [ ] New Lease with a non-existent email → clean 404-style error
- [ ] New Lease with your own email → rejected (tenant ≠ landlord)
- [ ] Activate a draft/pending lease → status flips to active, "tenant granted access" note
- [ ] Terminate an active lease → status changes, card updates
- [ ] Edit an active lease → values persist after reload
- [ ] Push Mobile Money Prompt → success/notice alert
- [ ] Utility reading (YAKA + NWSC) → reading saves; 30%+ spike → spike warning shows
- [ ] Generate each report (Tax / Portfolio / Utility) → appears under "Generated Reports"
- [ ] Open Evidence Chain Auditor → navigates, loads chain
- [ ] **Preview Tenant View** → tenant UI renders with exit banner; Exit Preview returns to owner view

## 5. Rental workspace — tenant
- [ ] Log in as `demo.tenant` → the unit appears (role-granted access works)
- [ ] Lease statement shows rent amount, period, status badge
- [ ] "Pay Rent via Mobile Money" triggers flow
- [ ] Log a maintenance request → appears under "My Maintenance Requests" and in owner's list
- [ ] Tenant must **not** see owner-only actions (no New Lease, no Reports, no utility entry)

## 6. Resident Command (household/estate)
- [ ] Services browse + category detail navigation
- [ ] Grocery ordering → appears in order history
- [ ] Cancel a grocery order → status updates
- [ ] Chama contribution + "Mark Paid" → confirm button works
- [ ] Empty states render when there's no history

## 7. Health services
- [ ] Triage: symptoms + age/duration → risk score, severity, provider chips, summary
- [ ] Emergency symptoms → auto-SOS appears
- [ ] Pharmacy discover by location → active pharmacies with stock counts
- [ ] Book doctor + cancel the booking
- [ ] Prescriptions feed loads
- [ ] SOS dispatch status feed loads

## 8. Trust Center
- [ ] Trust score, band, and reliability rows render for your role
- [ ] Evidence chain shows Intact/Broken with warning when broken
- [ ] Unresolved strikes listed
- [ ] Refresh button updates numbers

## 9. Construction workspace (Genesis)
- [ ] Budget vs Actual Spend card shows planned/spent/on-track badge
- [ ] Phase milestones show 3-way status (pending locked / awaiting review / verified)
- [ ] Material deliveries + diary entries render honestly (no fake fallbacks)

## 10. Cart & checkout
- [ ] Add to cart → badge count increments; remove → decrements
- [ ] Quantity updates reflect in total
- [ ] Empty cart state
- [ ] Checkout completes → success / transaction reference visible

## 11. Offline / caching
- [ ] Load a screen (e.g. assets or lease list) fully, then kill backend / airplane mode → app still shows last-fetched data with offline indicator
- [ ] Reconnect + refresh → fresh data replaces cache

## 12. Cross-cutting
- [ ] Tab navigation (Home / Cart / Account) works from any screen
- [ ] No screen crashes with empty backend data (empty states everywhere)
- [ ] 403s from a stranger-role action show a readable error, not a blank screen

---

## Automated tests

Jest + `jest-expo` + React Native Testing Library. Run with:

```sh
npm run test        # one-shot
npm run test:watch  # watch mode
npm run test:ci     # CI-safe (single run, no coverage)
```

| File                                    | Covers                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| `__tests__/api-client-test.ts`          | Auth header, offline-first GET cache write + fallback, 401 token refresh + retry, readable error surfacing |
| `__tests__/signup-test.tsx`             | Signup form: required-field validation, successful register + navigation, backend error display, thrown-error handling |
| `__tests__/portfolio-workspace-test.tsx`| Owner: cards, create-active-lease-by-email, Preview Tenant View, activate/terminate lease, push rent payment prompt. Tenant: lease statement, empty state, maintenance request modal |
| `__tests__/registered-assets-test.tsx`  | Asset creation: empty state, listing, name/rent/budget validation, create rental (UGX) + construction |
| `__tests__/home-screen-test.tsx`        | Home context dispatch: no active asset placeholder, rental→Portfolio, construction→Genesis, household buttons, dropdown asset switch |
| `__tests__/resident-command-test.tsx`   | Staff panel + registration, chama mark-paid, grocery order submit/cancel, family link code |
| `__tests__/health-services-test.tsx`    | Symptom triage + severity band + emergency ambulance, medicine delivery, doctor booking + ticket cancel, SOS dispatch |
| `__tests__/trust-center-test.tsx`       | Trust score/band render, broken hash chain warning + open strikes, refresh |
| `__tests__/genesis-workspace-test.tsx`  | Budget on-track/over-budget, phase start→review→complete flow, site diary, delivery QR, worker check-in, handover pack |
| `__tests__/cart-checkout-test.tsx`      | Cart empty state + quantity controls, checkout totals, phone required, pending modal, payment polling success/fail, init error |
