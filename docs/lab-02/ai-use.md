# Lab 2 — AI Use and Reflection

**LLM / Agent used:** Antigravity coding agent (Gemini 3.8 Flash)

## Selected Key Prompts (6–10)

| # | Prompt Name | Actual Prompt Text | My Reflection |
|---|-------------|-------------------|---------------|
| 1 | Plan Sprint 2 Specification & Traceability | สวัสดี กลับมาอีกครั้ง งาน Lab 2 มาแล้ว ช่วยวิเคราะห์ไฟล์และอธิบายให้ทีว่างานนี้ให้ทำอะไรบ้างภาพรวมเป็นยังไง ก่อนที่เราจะเริ่มกัน | AI analyzed the full PDF handout, outlined key objectives (Requester MVP, Zen Green theme, Development Requester simulation, Soft removal), clarified out-of-scope boundaries, and proposed an engineering contract workflow. |
| 2 | Decompose Sprint into GitHub Issues | เยี่ยม เรามาเริ่มกันเลย และเหมือนเดิมงานนี้มีการแบ่ง issue เพื่อรอให้เพื่อนตรวจและ approv แต่ในครั้งนี้จะต้องให้เพื่อนที่เป็น collaborator ซึ่งฉันจัดการเรื่องคนประเมินเอง แต่ฉันไม่แน่ใจว่ามีกี่ issue ได้ยินว่ามันค่อนข้างไดนามิกแต่ไม่แน่ใจนัก และอย่าลืมเตือนให้ฉันอัปเดท project workflow ด้วย (หากคุณไม่สามารถทำในส่วนนี้ได้) | AI created an implementation plan with 6 well-scoped GitHub Issues, established branch flow (`lab2-staging`), generated issues via GitHub CLI, and drafted complete Spec-DD & Test-DD documents. |
| 3 | Implement Development Requester Context | เยี่ยม ฉันคิดว่าเราพร้อมที่จะไปทำ issue ต่อไป Lab 2 issue 2 กันได้ เริ่มกันเลย | AI created the feature/lab2-requester-context branch, expanded Prisma schema with RequesterUser, RelatedSystem, Ticket, and Attachment models, generated migration, implemented idempotent seed data (4 active, 1 inactive), built GET /api/requesters/active endpoint and auth middleware, created Zen Green RequesterSelector UI with localStorage persistence, and added passing API-01 and UI-01 automated tests. |
| 4 | Implement Ticket Creation Flow | เยี่ยม ฉันได้รับการ approve และ merge เรียบร้อยแล้ว ฉันคิดว่าเราพร้อมที่จะไปต่อที่ issue ต่อไปแล้ว | AI established feature/lab2-ticket-creation, created ticket number generator adhering to BR-01 (TKT-YYYY-NNNNNN), built attachment constraint validator (BR-10, FR-06), configured multer disk storage with sanitized filenames, implemented POST /api/tickets with full validation and Prisma transaction, created Zen Green CreateTicket UI with form state preservation (BR-13), and passed UNIT-01, UNIT-02, API-02..04, UI-02..04. |
| 5 | Implement My Tickets & Ownership Separation | ตอนนี้ issue 3 ได้รับการ approve และ merge เรียบร้อยแล้ว เราไปขั้นต่อไปกันเลย | AI synced with lab2-staging, created feature/lab2-my-tickets, implemented GET /api/tickets with strict ownership isolation (requesterId), case-insensitive substring search, category/priority/status filters, pagination and active attachments count; developed polished Zen Green MyTickets view with responsive table/card layout, empty and no-results states, and verified with passing API-05, API-06, UI-05, and UI-06 tests. |
| 6 | Implement Ticket Detail & Attachment Lifecycle | issue 4 ได้รับการ approve และ merge เรียบร้อยแล้ว เริ่ม Issue 5 ได้เลย | AI established feature/lab2-ticket-detail-attachments, implemented GET /api/tickets/:id (with 403 cross-requester protection), POST /api/tickets/:id/attachments (max 5 active), GET /api/attachments/:id/download (with 410 Gone for removed attachments), DELETE /api/attachments/:id (soft-removal recording mandatory reason & timestamp); built Zen Green RequesterTicketDetail UI with read-only containers, attachment management, removal modal, and passed API-07..12 and UI-07..08 automated tests. |
| 7 | Run E2E Verification & Release Integration | ได้รับ approve และ merge เรียบร้อย เริ่ม Issue 6 ได้เลย | AI configured Playwright browser testing in `client/playwright.config.ts`, implemented `client/e2e/lab-02/requester-ticket-flow.spec.ts` (E2E-01 full lifecycle, E2E-02 ownership isolation, AC-13 responsive layouts), built complementary in-memory Vitest integration test `client/tests/lab-02/E2EIntegration.test.tsx`, verified 100% test passes across 64 tests with zero build errors, and completed release documentation. |

---

## Reflection

### 1. Spec-Driven Development (Spec-DD) & Test Traceability
Throughout Sprint 2, starting with a comprehensive engineering specification (`spec.md`) and a rigorous test plan (`tests.md`) before writing production code paid immense dividends. Every business rule (BR-01 to BR-13) and functional requirement (FR-01 to FR-13) was mapped to discrete test IDs across unit, API, UI, and E2E test suites. This eliminated ambiguity, prevented scope creep, and gave both the developer and peer reviewers objective criteria for acceptance.

### 2. Multi-Level Testing & Security Verification
A standout achievement in this sprint was verifying ownership isolation across all levels of the architecture:
- **API Level (`API-05`, `API-08`, `API-12`)**: Verified that querying tickets, inspecting details, or downloading files belonging to another requester consistently yields `403 Forbidden` or empty results, ensuring zero data leakage.
- **UI Level (`UI-05`, `UI-08`)**: Confirmed that the UI displays appropriate empty states, disables actions on soft-removed files, and preserves input state on server errors.
- **Browser E2E Level (`E2E-01`, `E2E-02`)**: Playwright drove real Chromium sessions switching between Jennifer Anderson and Michael Brown, validating that neither UI state nor browser caching leaks cross-user ticket information.

### 3. Collaboration & Peer Review Hygiene
Adopting a strict feature-branch workflow targeting `lab2-staging` rather than pushing directly to `main` simulated professional team engineering. Each pull request (Issues 1 through 6) was cleanly scoped, accompanied by reproduction/verification steps, and systematically peer-reviewed. Merging occurred only when both automated tests passed and human approval was granted.

### 4. Effective AI Collaboration Insights
Using Antigravity / LLM effectively required precise prompting:
- **High-level domain clarity:** Providing the full handout and technical constraints up front enabled the AI to architect the system consistently.
- **Contract-first guidance:** Instructing the AI to adhere strictly to existing TypeScript interfaces, route signatures, and database schemas prevented divergent implementations across issues.
- **Proactive verification:** Requiring the AI to execute unit tests, API tests, Playwright runs, and TypeScript production builds before committing ensured that no regressions escaped into the pull request.
