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
