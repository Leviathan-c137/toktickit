# Lab 1 — AI Use and Reflection

**LLM/agent used:** Antigravity coding agent (Gemini 3.6 Flash)

## Selected key prompts (6–10)

| # | Prompt Name | Actual Prompt Text | My Reflection |
|---|-------------|-------------------|---------------|
| 1 | Plan Lab 1 Implementation | Read the enclosed TokTickIT Lab 1 requirements. Summarize the four GitHub Issues, their dependencies, required outputs, and required automated tests. Propose an implementation order, but do not write code yet. | Provided clear step-by-step issue dependencies and setup plan. |
| 2 | Set Up Full-Stack Project | Setup the TokTickIT project tech stack as given in Lab 1 using React, TypeScript, Vite, and Bootstrap for the frontend, and Node.js, Express, and TypeScript for the backend. Configure PostgreSQL and Prisma. Use the required folder structure. Do not add functionality beyond the Lab 1 scope. | Successfully initialized dependencies, environment configuration, and project foundation. |
| 3 | Implement Health Check | Add GET /api/health to the existing Express backend. It must return HTTP 200 with JSON status=ok and service=TokTickIT API. Verify using Supertest in server/tests/lab-01/health.test.ts. | Implemented route cleanly and verified with Supertest integration test. |

## Reflection

I used the Antigravity coding agent to assist with project setup, environment configuration, and structured workflow execution across individual issues. Breaking down the work into discrete feature branches with clear acceptance criteria ensured that each layer of the full-stack architecture was systematically verified.
