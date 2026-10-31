# Lab 4 — AI Use Record & Reflection

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 4 — TokTickIT Actions Taken, Dashboards, and Final Regression  
**AI Coding Assistant:** Antigravity AI (Gemini 3.8 Flash)  

---

## 1. Primary AI Prompts & Workflow Log

Below are key prompts used during the Specification Driven Development (Spec DD) and Test Driven Development (TDD) process for Lab 4:

| Prompt # | Phase / Goal | Selected Prompt Text | Impact & Result |
|---|---|---|---|
| **Prompt 1** | Requirement Analysis | *"วิเคราะห์ไฟล์นี้และอธิบายว่า Lab 4 ให้ทำอะไรบ้าง ก่อนที่เราจะเริ่มทำ"* | Thoroughly analyzed the Lab 4 handout, identified 4 core pillars (Actions Taken, Dashboards, Ticket Workflow, Final Regression), extracted business rules and 9 grading parts. |
| **Prompt 2** | Workflow & Branch Strategy | *"เยี่ยม งั้นมาเริ่มกันเลย และอย่าลืมว่าในงานนี้ยังคงมีการให้เพื่อน review,approveและmerge ก่อนไปขั้นถัดไปเหมือนงานก่อนๆ"* | Initialized `lab4-staging` branch, created 6 decomposed GitHub Issues (#50–#55), and enforced the peer-review branching model. |
| **Prompt 3** | Spec DD Generation | *"Generate docs/lab-04/specification.md, ui-spec.md, api-spec.md, tests.md adhering strictly to Zen Green design and security rules."* | Formulated Sprint 4 engineering contract, 12 Business Rules (BR-01 to BR-12), 12 Acceptance Criteria (AC-01 to AC-12), and REST API specifications. |
| **Prompt 4** | Database & Migration Planning | *"Evolve schema.prisma with ActionTaken model, relational foreign keys, cascade deletion, and idempotent seed generation."* | Designed non-destructive migration preserving Lab 1–3 data and established multi-action seed scenarios. |
| **Prompt 5** | Actions Taken Backend & Tests | *"Implement Actions Taken CRUD REST endpoints, role-based authorization gates, and automated Vitest test suite."* | Built backend handlers enforcing BR-01 to BR-05 and achieving 100% test pass on action records. |
| **Prompt 6** | Actions Taken UI Implementation | *"Create Ticket Detail Actions Taken list, create/edit modal with validation for mandatory follow-up notes, and Requester read-only view."* | Implemented Zen Green responsive components, follow-up amber badges, and client unit tests. |
| **Prompt 7** | Ticket Workflow & Resolution Gate | *"Enforce ticket status transition state machine, resolution gate restricted to IT Staff, and advisory requester indicator."* | Implemented state transition matrix and conflict detection to prevent stale overwrite bugs. |
| **Prompt 8** | Operational Role Dashboards | *"Build Requester and IT Staff dashboard APIs and UI with responsive metric cards, drill-down navigation, and empty states."* | Delivered server-aggregated metrics with clickable drill-down filters for desktop, tablet, and mobile. |
| **Prompt 9** | E2E Testing & Hardening | *"Implement Playwright test suites for actions-taken-flow, ticket-resolution, dashboards, and responsive layout verification."* | Verified end-to-end integration and responsive layouts across 1280px, 820px, and 375px viewports. |
| **Prompt 10** | Review & Release Documentation | *"Compile reviewer.md, capture multi-breakpoint UI screenshots, and verify complete test suite passing for staging merge."* | Verified full traceability from GitHub Issues to PR reviews and completed final submission package. |

---

## 2. My Reflection

Working with AI agents across Sprint 4 demonstrates the maturity of the Specification Driven Development (Spec DD) and Test Driven Development (TDD) workflow:
1. **Upfront Specification Eliminates Ambiguity**: By formally defining the status transition matrix, resolution gate authority, and conditional validation (`followUpNote` required only when `followUpRequired = true`) before writing code, we avoided architectural rework and regression bugs.
2. **Sub-Record Modeling & Data Integrity**: AI assisted in designing the `ActionTaken` child model with proper foreign keys (`ticketId`, `performedById`), ensuring that individual actions are immutably tied to the executing staff member while preserving the primary ticket coordinator role.
3. **Role-Appropriate Information Architecture**: Dashboards were designed from authoritative backend queries rather than frontend state scraping, guaranteeing strict data isolation for Requesters and high-performance metrics for IT Staff.
4. **Rigorous Peer Review Cadence**: Combining AI speed with human collaborator verification (peer review, approval, and branch merging) created high-quality, fully auditable engineering deliverables ready for production deployment.
