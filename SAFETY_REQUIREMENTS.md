# HMS Safety & Security Requirements Charter

This document maps the project's non-negotiable engineering principles to the
**current status in this codebase** and the module that must own each item.

Status legend:
- ❌ Not implemented / blocked on backend
- 🟡 Partial (prototype-level; correct intent, insufficient enforcement)
- ✅ Implemented and verified

> **Architecture reality check (2026-09):** this repo is a **frontend-only**
> React 19 + Vite application. There is no ASP.NET Core API, no SQL Server
> database, and no server-side enforcement of any kind. All persistence is
> `window.localStorage` (`receptionService.ts`, `doctorStorage.ts`), and
> authentication uses hard-coded local accounts with plaintext passwords
> (`auth.service.ts`). Every item marked ❌ is unimplementable until the
> backend exists.

---

## 1. Patient safety over convenience
| # | Requirement | Status | Owner |
|---|---|---|---|
| 1.1 | No silent mutation of safety-critical data (diagnosis, prescription, allergy, admission, dispensing) | ❌ | Backend Clinical/Prescriptions/Pharmacy APIs |
| 1.2 | Dangerous operations require explicit confirmation | ✅ Audited 2026-09: appointment booking, walk-in queueing, payment recording and pharmacy dispensing all require explicit `ConfirmDialog` confirmation (two-step flow); patient registration already did | Frontend feature modules |
| 1.3 | Duplicate submissions / double-clicks cannot create duplicate clinical records | ❌ Requires idempotency keys + server transactions | Backend API + apiClient |

## 2. No destruction of clinical history
| # | Requirement | Status | Owner |
|---|---|---|---|
| 2.1 | Clinical records are never hard-deleted or overwritten; corrections create amendments (old value, new value, reason, author, timestamp, original ref) | ❌ | Backend Clinical + Audit schema |
| 2.2 | Demographics updates preserve prior values | ❌ `updatePatient()` (receptionService.ts) overwrites in place with no history | Backend Patients API |

## 3. Attribution / audit
| # | Requirement | Status | Owner |
|---|---|---|---|
| 3.1 | Audit log answers: who, what, which patient/record, when, why, from where, previous value, new value | ❌ | Backend Audit module |
| 3.2 | Audit logs protected from ordinary modification/deletion | ❌ | Backend Audit + DB permissions |

## 4. Least privilege / backend-enforced authorization
| # | Requirement | Status | Owner |
|---|---|---|---|
| 4.1 | Role-appropriate data visibility (receptionists see no diagnoses; pharmacists cannot edit diagnoses; doctors out of financial admin; admins get no automatic clinical access) | ❌ Data-level filtering impossible frontend-only | Backend Authorization policy |
| 4.2 | Authorization enforced by backend API, not hidden buttons | 🟡 `src/lib/permissions.ts` + `src/auth/PermissionGuard.tsx` gate the **UI** only; no backend exists to enforce anything | Backend (authoritative) + frontend (UX only) |
| 4.3 | Receptionist role scoped to registration/queue/appointments only | 🟡 Consistent with intent in `auth.service.ts` local accounts; must be re-declared server-side | Backend Identity |

## 5. Patient identity
| # | Requirement | Status | Owner |
|---|---|---|---|
| 5.1 | Permanent unique MRN, never reused, DB-issued | 🟡 Frontend side fixed 2026-09: client no longer fabricates `MH-` MRNs — `createPatient` issues a collision-checked, clearly marked `PROV-` provisional identifier; permanent MRN issuance still requires the backend (DB unique index) | Backend Patients + DB unique index |
| 5.2 | Duplicate detection on name/DOB/phone/CNIC/guardian | 🟡 `searchPatientsByIdentity()` warns on mobile/MRN/CNIC match — client-side warning over localStorage, not a blocking server check | Backend Patients + DB constraints |
| 5.3 | Block creation when strong duplicate match found (not just warn) | ❌ Currently warning-only | Backend Patients |


## 6. Medication safety
| # | Requirement | Status | Owner |
|---|---|---|---|
| 6.1 | Prescription model: status, prescriber, medicine, strength, route, frequency, duration, quantity, instructions, dispensing history | ❌ | Backend Prescriptions module |
| 6.2 | Block dispensing against expired stock / cancelled / completed prescriptions / unauthorized medicines unless authorized override is recorded | ❌ | Backend Pharmacy module |

## 7. Inventory ledger
| # | Requirement | Status | Owner |
|---|---|---|---|
| 7.1 | Every stock change produces a stock-movement record (medicine, batch, expiry, qty in/out, supplier, prices, reason, user, timestamp); stock is derived, not a bare counter | ❌ | Backend Pharmacy + DB transactions |

## 8. Financial history
| # | Requirement | Status | Owner |
|---|---|---|---|
| 8.1 | Invoices/discounts/payments/refunds/cancellations transactional; adjustments preserve original amount, reason, approval, responsible staff | ❌ `createPayment()` is a no-op stub | Backend Billing module |

## 9. Application security (OWASP ASVS baseline)
| # | Requirement | Status | Owner |
|---|---|---|---|
| 9.1 | Password hashing (server-side), no plaintext credentials in code | 🟡 Demo credentials are now gated behind `VITE_USE_MOCK_AUTH` (`.env.development` only — verified absent from the production bundle); real authentication, hashing and lockout remain backend work | Backend Identity |
| 9.2 | MFA capability | ❌ | Backend Identity |
| 9.3 | Failed-login protection + account lockout | ❌ Client code anticipates HTTP 423 (commented-out login path) but no backend | Backend Identity |
| 9.4 | JWT access + rotating refresh tokens | ❌ Current "tokens" are fake strings in localStorage | Backend Identity |
| 9.5 | HTTPS, secure cookies, rate limiting, restricted CORS | ❌ | Backend/infra |
| 9.6 | Server-side input validation (never trust browser) | 🟡 Zod schemas client-side (`patientSchemas.ts`, `login.schema.ts`); `updatePatient()` now uses an explicit whitelist (no payload spread) on the frontend — the backend must enforce the same rule server-side | Backend API |
| 9.7 | Parameterized DB access, output encoding, secure file uploads | ❌ | Backend |
| 9.8 | Centralized secret management; secrets never in repo | 🟡 No secrets committed yet (good); `VITE_API_BASE_URL` env-only (fine) | Infra |

## 10. CIA triad / ISMS (ISO 27001, ISO 27799:2025)
| # | Requirement | Status | Owner |
|---|---|---|---|
| 10.1 | Permissions + integrity controls + monitoring beyond encryption | ❌ | Backend + ops |
| 10.2 | Backups, off-site encrypted copies, retention policy, restore-tested, defined RPO/RTO, downtime procedure | ❌ No server exists; localStorage is user-clearable and unencrypted | Ops |


## 11. Interoperability
| # | Requirement | Status | Owner |
|---|---|---|---|
| 11.1 | HL7 FHIR for structured exchange | ❌ Not designed | Backend integration layer |
| 11.2 | DICOM for imaging/PACS | ❌ | Backend integration layer |

## 12. Server-side data validation & concurrency
| # | Requirement | Status | Owner |
|---|---|---|---|
| 12.1 | ASP.NET Core independently validates every request; anti-mass-assignment; anti-IDOR | 🟡 Frontend-side whitelist added to `updatePatient()` (unit-tested); backend enforcement still required | Backend API |
| 12.2 | Optimistic concurrency (rowversion) on records where simultaneous edits are dangerous | ❌ No server, no version token anywhere | Backend + DB |

## 13. Availability / failure survival
No recoverability exists today; all data dies with the browser profile (see 10.2).

## 14. UI safety / usability
| # | Requirement | Status | Owner |
|---|---|---|---|
| 14.1 | Distinguish similar-named patients, show allergies prominently, units beside measurements, confirm dangerous ops, reliable printing | 🟡 ConfirmDialog now guards all mutations; registration form expanded 2026-09 with the standard required field set (FHIR US Core / Registrar Playbook aligned: DOB mandatory, blood group, structured address with province, emergency contact phone required with guardian, occupation/nationality/religion/preferred language optional); allergy banner, similar-patient disambiguation, unit display still pending | Frontend |
| 14.2 | WCAG 2.2 Level AA | ❌ No audit performed | Frontend |

## 15. Domain separation
| # | Requirement | Status | Owner |
|---|---|---|---|
| 15.1 | Modules: Patients, Appointments, Clinical, Prescriptions, Pharmacy, Laboratory, Admissions, Billing, Staff, Identity, Audit, Documents, Notifications, Reporting; business rules out of controllers | 🟡 Frontend folder structure (`src/features/doctor|pharmacy|reception`) is directionally right; backend module map not yet created | Backend architecture |

## 16. Database as second line of defense
| # | Requirement | Status | Owner |
|---|---|---|---|
| 16.1 | FKs, unique constraints, NOT NULL, check constraints, indexes, transactions, concurrency tokens | ❌ | DB schema design |

## 17. Privacy / minimum necessary
| # | Requirement | Status | Owner |
|---|---|---|---|
| 17.1 | Sensitive exports permission-controlled + audited; logs never expose passwords/JWTs/clinical data | ❌ | Backend Audit + logging policy |
| 17.2 | CNIC and full registration payloads stored unencrypted in localStorage (`PATIENT_DETAILS_STORAGE_KEY`) | ✅ Fixed 2026-09: persisted cache now stores only masked identifiers (CNIC `42101-*******-8`, masked email/phone); duplicate detection preserved via a truncated fingerprint index (`hms-identity-fingerprints`, last 6 CNIC digits only); legacy contaminated caches are re-masked on load | Frontend (backend DB must remain the permanent store) |

## 18. Integration fail-safety
| # | Requirement | Status | Owner |
|---|---|---|---|
| 18.1 | Idempotency, outbox pattern, retries, integration logs, reconciliation for lab/payment/SMS/PACS | ❌ | Backend integration layer |

## 19. Jurisdictional compliance (Pakistan / Sindh)
| # | Requirement | Status | Owner |
|---|---|---|---|
| 19.1 | Overlay healthcare licensing, professional practice, medicines/pharmacy, tax, privacy, cybersecurity requirements on engineering controls | ❌ Not yet mapped | Project owner + legal advisor |


---

## Immediate actionable items in this repo (no backend required)

1. ✅ **[DONE]** Demo credentials gated behind `VITE_USE_MOCK_AUTH` (`auth.service.ts` fails closed when the flag is absent; flag enabled only in `.env.development`; verified absent from the production bundle).
2. ✅ **[DONE]** localStorage cache sanitized — CNIC/email/guardian phone masked on persist and on load; duplicate detection preserved via truncated fingerprint index.
3. ✅ **[DONE]** `Math.random()` MRN removed — deterministic, collision-checked `PROV-*` provisional identifiers; unit tests assert format, uniqueness and searchability.
4. ✅ **[DONE]** `updatePatient()` rewritten with an explicit field whitelist; protected fields (MRN, status, registration date) and unknown fields are ignored; unit-tested.
5. ✅ **[DONE]** ConfirmDialog audit complete: appointment booking, walk-in queueing, payment recording and pharmacy dispensing now use two-step confirmation; registration already did.
6. ✅ **[DONE]** Unit tests added for duplicate detection (phone formatting-independent, CNIC, fingerprint-after-reload, MRN, empty/no-match), masking, fingerprints, whitelist and NOT_FOUND handling — 14/14 passing; `npm run build` clean.

