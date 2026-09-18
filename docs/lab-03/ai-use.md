# Lab 3 — AI Use Record & Reflection

**Course:** CPE 334 Software Engineering Laboratory  
**Sprint:** Lab 3 — TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens  
**AI Coding Assistant:** Antigravity AI (Gemini 3.6 Flash)  

---

## 1. Primary AI Prompts & Workflow Log

Below are key prompts used during the Specification Driven Development (Spec DD) and Test Driven Development (TDD) process for Lab 3:

| Prompt # | Phase / Goal | Selected Prompt Text | Impact & Result |
|---|---|---|---|
| **Prompt 1** | Requirement Analysis | *"ช่วยวิเคราะห์ไฟล์และสรุปให้ทีว่าต้องทำอะไรบ้างก่อนจะเริ่มงาน Lab 3"* | Analyzed Lab 3 PDF requirements, extracted roles, business rules, and deliverables. |
| **Prompt 2** | GitHub Kanban Decomposition | *"เยี่ยม งั้นมาเริ่มกันเลย เหมือนเดิม เราจะทำไปทีละ issue และฝากจัดการในส่วนของ Github"* | Decomposed Sprint 3 into 7 GitHub Issues (#34 - #40) and set up `lab3-staging` and feature branches. |
| **Prompt 3** | Spec DD Generation | *"Generate docs/lab-03/specification.md, ui-spec.md, api-spec.md, tests.md adhering strictly to Zen Green design and security rules."* | Created comprehensive engineering specification, REST API contract, UI guidelines, and test traceability matrix. |
| **Prompt 4** | Data Model & Migration | *"Evolve RequesterUser model to User model in Prisma with roles, password hashing, and seed data."* | Generated updated Prisma schema with `User`, `PublicComment`, and `InternalNote` models. |
| **Prompt 5** | Authentication Foundation | *"Implement JWT session authentication, password hashing, login/logout, and mandatory first-login password change."* | Built backend authentication middleware and first-login password change flow. |
| **Prompt 6** | Staff Queue & Detail Workflow | *"Implement IT Staff Queue query engine and IT Staff Detail view with visually distinct Public Comments vs Internal Notes."* | Created Queue APIs with search/filter/sort/pagination and dual-comment UI components. |
| **Prompt 7** | Admin User Management | *"Implement Admin User Management UI and safety rules blocking self-deactivation and deactivating last active admin."* | Built Admin user table, modal dialogs, and backend guardrails. |
| **Prompt 8** | Test Automation & Release | *"Create Vitest API tests, React component tests, Playwright E2E tests, and prepare final reviewer record."* | Achieved 100% test pass rate across unit, API, component, and E2E test suites. |

---

## 2. My Reflection

Using AI specification and coding capabilities in Lab 3 significantly accelerated complex architectural work. In particular:
1. **Specification Driven Development (Spec DD)**: Defining business rules (such as mandatory first-login password changes, public vs internal comment isolation, and admin safety guardrails) prior to implementation prevented security flaws and scope creep.
2. **Data Model Migration**: Evolving the Lab 2 schema to support real authentication without losing existing ticket data required strict schema planning. AI assistance ensured relationships (`requesterId`, `ownerId`) and foreign key constraints remained intact.
3. **Role-Based Authorization Enforcement**: Server-side RBAC middleware was established systematically, preventing hidden UI controls from being the sole line of defense.
4. **Visual Hierarchy & User Experience**: The Zen Green design system was consistently applied, especially in making Public Comments (green accent) and Internal Notes (amber accent) visually distinct to protect operational privacy.
