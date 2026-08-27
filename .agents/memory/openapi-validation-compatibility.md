---
name: OpenAPI validation compatibility
description: The relationship between Orval's generated Zod syntax and the workspace Zod dependency.
---

The generated validation layer must use a Zod version that supports the syntax emitted by the installed Orval generator, including top-level helpers such as `z.int()` and `z.email()`.

**Why:** The workspace initially resolved Zod 3 while the current generator emitted Zod 4 APIs, causing code generation to succeed but the library typecheck to fail.

**How to apply:** When changing the API contract or generator version, check the generated validation output and the workspace catalog together before debugging route or schema code.