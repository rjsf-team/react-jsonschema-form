---
title: The default validator is a client module
description: "The default export of each validator package now comes from a `'use client'` module, so in server code it is a client reference and calling it throws. Validate on the server with a validator of your own from `customizeValidator()`."
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata', '@rjsf/validator-cfworker']
uses: [utils-api, tooling]
schema: []
affects: [code, setup]
related: []
---

## Detect

- In your code: the default export of `@rjsf/validator-ajv8`, `@rjsf/validator-ata` or `@rjsf/validator-cfworker` imported into server code, meaning a module React Server Components loads outside a `'use client'` boundary, such as a server component, a Server Action, a Next.js Route Handler (`route.ts`) or `generateMetadata`.
- In that server code: a call to one of the validator's methods, or the validator passed to a `@rjsf/utils` function such as `getDefaultFormState()`.
- At runtime on the server: those calls throw where they used to validate.

## Change

The default export now comes from a `'use client'` module, so a React Server Component can pass it to `Form`. In server code it is a client reference, so its methods can't be called there. Everywhere else, a client component rendered on the server included, it works as before.

To validate on the server, make a validator of your own with `customizeValidator()`:

```diff
 'use server';
-import validator from '@rjsf/validator-ajv8';
+import { customizeValidator } from '@rjsf/validator-ajv8';
+
+const validator = customizeValidator();
```

Passing the default `validator` from a server component to `Form` needs no change. See [Server components](../../01-quickstart.md#server-components).

## Verify

- Server code that validates data, or calls a `@rjsf/utils` function with a validator, runs without throwing.
- A server component that renders `Form` with the default `validator` still renders and validates in the browser.
