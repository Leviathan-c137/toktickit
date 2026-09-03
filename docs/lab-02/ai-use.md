# Lab 2 — AI Use and Reflection

**LLM / Agent used:** Antigravity coding agent (Gemini 3.8 Flash)

## Selected Key Prompts (6–10)

| # | Prompt Name | Actual Prompt Text | My Reflection |
|---|-------------|-------------------|---------------|
| 1 | Plan Sprint 2 Specification & Traceability | สวัสดี กลับมาอีกครั้ง งาน Lab 2 มาแล้ว ช่วยวิเคราะห์ไฟล์และอธิบายให้ทีว่างานนี้ให้ทำอะไรบ้างภาพรวมเป็นยังไง ก่อนที่เราจะเริ่มกัน | AI analyzed the full PDF handout, outlined key objectives (Requester MVP, Zen Green theme, Development Requester simulation, Soft removal), clarified out-of-scope boundaries, and proposed an engineering contract workflow. |
| 2 | Decompose Sprint into GitHub Issues | เยี่ยม เรามาเริ่มกันเลย และเหมือนเดิมงานนี้มีการแบ่ง issue เพื่อรอให้เพื่อนตรวจและ approv แต่ในครั้งนี้จะต้องให้เพื่อนที่เป็น collaborator ซึ่งฉันจัดการเรื่องคนประเมินเอง แต่ฉันไม่แน่ใจว่ามีกี่ issue ได้ยินว่ามันค่อนข้างไดนามิกแต่ไม่แน่ใจนัก และอย่าลืมเตือนให้ฉันอัปเดท project workflow ด้วย (หากคุณไม่สามารถทำในส่วนนี้ได้) | AI created an implementation plan with 6 well-scoped GitHub Issues, established branch flow (`lab2-staging`), generated issues via GitHub CLI, and drafted complete Spec-DD & Test-DD documents. |
| 3 | Implement Development Requester Context | เยี่ยม ฉันคิดว่าเราพร้อมที่จะไปทำ issue ต่อไป Lab 2 issue 2 กันได้ เริ่มกันเลย | AI created the feature/lab2-requester-context branch, expanded Prisma schema with RequesterUser, RelatedSystem, Ticket, and Attachment models, generated migration, implemented idempotent seed data (4 active, 1 inactive), built GET /api/requesters/active endpoint and auth middleware, created Zen Green RequesterSelector UI with localStorage persistence, and added passing API-01 and UI-01 automated tests. |
| 4 | Implement Ticket Creation Flow | *(To be added during Issue 3 execution)* | |
| 5 | Implement My Tickets & Ownership Separation | *(To be added during Issue 4 execution)* | |
| 6 | Implement Ticket Detail & Attachment Lifecycle | *(To be added during Issue 5 execution)* | |
| 7 | Run E2E Verification & Responsive Screenshots | *(To be added during Issue 6 execution)* | |

---

## Reflection
*(Will be expanded with our final reflection on using AI for Spec-Driven Development, Test Traceability, and Engineering Workflow in Lab 2)*
