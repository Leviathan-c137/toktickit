# Lab 1 — Test Plan and Evidence

All test files live under `server/tests/lab-01/` and `client/tests/lab-01/`.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | PASSED |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | Pending (Issue 4) |
| 3 | Vitest | Heading renders | PASSED |
| 4 | Vitest | Success state shows Online + category list | Pending (Issue 4) |
| 5 | Vitest | Error state shows Offline + message | Pending (Issue 4) |

### Terminal Output Evidence:

#### Server Health Check Test (Supertest):
```text
 RUN  v2.1.9 C:/Users/admin/Downloads/Lab1_Starter_Scaffold/toktickit/server

 ✓ tests/lab-01/health.test.ts (1 test) 22ms

 Test Files  1 passed | 1 skipped (2)
      Tests  1 passed | 1 todo (2)
```

#### Client Heading Test (Vitest):
```text
 RUN  v2.1.9 C:/Users/admin/Downloads/Lab1_Starter_Scaffold/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3 tests | 2 skipped) 20ms

 Test Files  1 passed (1)
      Tests  1 passed | 2 todo (3)
```
