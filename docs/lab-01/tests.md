# Lab 1 — Test Plan and Evidence

All test files live under `server/tests/lab-01/` and `client/tests/lab-01/`.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | PASSED |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | PASSED |
| 3 | Vitest | Heading renders | PASSED |
| 4 | Vitest | Success state shows Online + category list | PASSED |
| 5 | Vitest | Error state shows Offline + message | PASSED |

### Terminal Output Evidence:

#### Server Integration Tests (Supertest):
```text
 RUN  v2.1.9 C:/Users/admin/Downloads/Lab1_Starter_Scaffold/toktickit/server

 ✓ tests/lab-01/health.test.ts (1 test) 22ms
 ✓ tests/lab-01/categories.test.ts (1 test) 126ms

 Test Files  2 passed (2)
      Tests  2 passed (2)
```

#### Client Unit Tests (Vitest):
```text
 RUN  v2.1.9 C:/Users/admin/Downloads/Lab1_Starter_Scaffold/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3 tests) 98ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

#### Prisma Category Seed Evidence (Issue 3):
```text
> toktickit-server@1.0.0 prisma:seed
> tsx prisma/seed.ts

Categories seeded successfully. (Verified idempotent: 4 categories present in ID order)
```

## Git Network Graph Evidence

The Git Network Graph demonstrates the structured Git Flow branching strategy followed throughout the development of Lab 1. Each feature was developed on an isolated branch created from `lab1-staging`, validated through automated test suites, reviewed via Pull Requests (PRs #16–#19), and merged sequentially into `lab1-staging` before final release integration into `main`.

### 1. Feature 1: Project Foundation Setup (`feature/1-project-foundation` — PR #16)
- **Description:** Initialized full-stack workspace structure containing Express backend (`server/`), React Vite frontend (`client/`), TypeScript configurations, environment templates (`.env.example`), and core dependency setups.
- **Merge Trajectory:** `feature/1-project-foundation` ➔ Merged into `lab1-staging` (PR #16).
- **Network Graph Representation:**
  ```text
  *   merge PR #16: feature/1-project-foundation -> lab1-staging
  |\  
  | * commit: Initialized full-stack project structure and dependencies
  |/  
  * commit (lab1-staging): Repository initialization
  ```

### 2. Feature 2: Health Check Endpoint (`feature/2-health-check` — PR #17)
- **Description:** Implemented the `GET /api/health` REST endpoint returning HTTP 200 `{ status: "ok", service: "TokTickIT API" }` and integrated Supertest verification tests under `server/tests/lab-01/health.test.ts`.
- **Merge Trajectory:** `feature/2-health-check` ➔ Merged into `lab1-staging` (PR #17).
- **Network Graph Representation:**
  ```text
  *   merge PR #17: feature/2-health-check -> lab1-staging
  |\  
  | * commit: Add GET /api/health API & Supertest integration suite
  |/  
  ```

### 3. Feature 3: Prisma Category Schema & Seed (`feature/3-category-seed` — PR #18)
- **Description:** Created the `Category` model schema in Prisma, executed database migrations, and implemented an idempotent seed script (`server/prisma/seed.ts`) populating default categories (*Account & Access, Hardware, Software, Network*).
- **Merge Trajectory:** `feature/3-category-seed` ➔ Merged into `lab1-staging` (PR #18).
- **Network Graph Representation:**
  ```text
  *   merge PR #18: feature/3-category-seed -> lab1-staging
  |\  
  | * commit: Define Category Prisma model & idempotent seed script
  |/  
  ```

### 4. Feature 4: Category List API & UI Integration (`feature/4-category-list` — PR #19)
- **Description:** Developed backend `GET /api/categories` endpoint and updated React client UI to render category lists dynamically with Online/Offline status indicators. Verified complete functionality with Vitest and Supertest suites.
- **Merge Trajectory:** `feature/4-category-list` ➔ Merged into `lab1-staging` (PR #19) ➔ Final release merge into `main`.
- **Network Graph Representation:**
  ```text
  *   merge lab1-staging -> main (Lab 1 Final Release)
  |
  *   merge PR #19: feature/4-category-list -> lab1-staging
  |\  
  | * commit: Add category list API, React state UI, and full test suite
  |/  
  ```

## Application Demo Description

### 1. Overview & System Architecture
The TokTickIT application is a full-stack IT service desk interface that allows users to verify system operational health and retrieve available IT service request categories. The application handles dynamic state transitions (`idle` ➔ `loading` ➔ `success` / `error`) based on real-time API connectivity with the Express backend and PostgreSQL database.

### 2. Interactive UI Demo Scenarios

#### Scenario A: Complete / Success State (Backend & DB Online)
- **Pre-conditions:** Express API server running on port `3000` with PostgreSQL seeded with standard category models.
- **Action:** User navigates to the frontend interface (`http://localhost:5173`) and clicks the **"Check System"** button.
- **Observed Behavior:**
  1. **Loading Transition:** The button enters a disabled state displaying `"Loading…"`.
  2. **Status Banner:** A green success alert displays **`Status: Online`**.
  3. **Data Rendering:** A dynamic list group renders the four seeded categories in ascending ID order:
     - `Account & Access`
     - `Hardware`
     - `Software`
     - `Network`

#### Scenario B: Failure / Error State (Backend Offline / Network Exception)
- **Pre-conditions:** Express API server is stopped or unreachable.
- **Action:** User clicks the **"Check System"** button while backend service is offline.
- **Observed Behavior:**
  1. **Error Handling:** The API client catches the connection refusal (`FetchError` / `NetworkError`).
  2. **Status Banner:** A red alert banner immediately displays **`Status: Offline — Unable to connect to TokTickIT API`**.
  3. **UI Guardrail:** Category list is safely omitted from view to avoid rendering stale/corrupted state.

### 3. UI State Matrix Summary

| State | Trigger Action | Alert Badge Style | Main Display Content |
| :--- | :--- | :--- | :--- |
| **Idle** | Page Initial Load | None | Application Title & "Check System" Action Button |
| **Loading** | User Clicks Button | Neutral / Disabled Button | `"Loading…"` text indicator |
| **Success** | API returns 200 OK + Data | `alert-success` (Green) | **`Status: Online`** + List of 4 Categories |
| **Error** | Connection Refused / 500 Error | `alert-danger` (Red) | **`Status: Offline — <Error Details>`** |

