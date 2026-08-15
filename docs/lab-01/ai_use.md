# Lab 1 — AI Use and Reflection

**LLM/agent used:** Antigravity coding agent (Gemini 3.6 Flash)

## Selected key prompts (6–10)

| # | Prompt Name | Actual Prompt Text | My Reflection |
|---|-------------|-------------------|---------------|
| 1 | Plan Lab 1 Implementation | Read the enclosed TokTickIT Lab 1 requirements. Summarize the four GitHub Issues, their dependencies, required outputs, and required automated tests. Propose an implementation order, but do not write code yet. | Provided clear step-by-step issue dependencies and setup plan. |
| 2 | Set Up Full-Stack Project | Setup the TokTickIT project tech stack as given in Lab 1 using React, TypeScript, Vite, and Bootstrap for the frontend, and Node.js, Express, and TypeScript for the backend. Configure PostgreSQL and Prisma. Use the required folder structure. Do not add functionality beyond the Lab 1 scope. | Successfully initialized dependencies, environment configuration, and project foundation. |
| 3 | Implement Health Check | Add GET /api/health to the existing Express backend. It must return HTTP 200 with JSON status=ok and service=TokTickIT API. Verify using Supertest in server/tests/lab-01/health.test.ts. | Implemented route cleanly and verified with Supertest integration test. |
| 4 | Seed Category Model | Define Category model in Prisma schema with id, unique name, and createdAt fields. Write an idempotent seed script in server/prisma/seed.ts using upsert for Account and Access, Hardware, Software, Network categories. | Generated migration, created Category table in PostgreSQL, and verified idempotent seeding twice without duplicate errors. |
| 5 | Category List API and UI | Add GET /api/categories endpoint returning categories ordered by id in Express. Update React client checkSystem API function and App UI to display Online status with categories list on success, and Offline status on error. Add Supertest and Vitest tests. | Implemented backend GET /api/categories endpoint, frontend state transitions and rendering, and verified with 100% passing Supertest and Vitest tests. |

## Reflection

I used the Antigravity coding agent to assist with project setup, environment configuration, and structured workflow execution across individual issues. Breaking down the work into discrete feature branches with clear acceptance criteria ensured that each layer of the full-stack architecture was systematically verified.
