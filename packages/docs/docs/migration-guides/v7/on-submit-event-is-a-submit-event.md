---
title: The onSubmit event is typed SubmitEvent instead of FormEvent
description: "The `event` parameter of `onSubmit` is now typed `SubmitEvent<HTMLFormElement>` instead of the deprecated `FormEvent<any>`. Annotate your handler's event parameter as `SubmitEvent` from `react`."
packages: ['@rjsf/core']
uses: [typescript]
schema: []
affects: [code]
related: [types-react-19-2-18-required]
---

## Detect

- Your TypeScript `onSubmit` handler annotates its event parameter as `FormEvent` from `react`. The type checker still accepts it, but `FormEvent` is deprecated.

## Change

The `event` parameter passed to `onSubmit` is now typed as `SubmitEvent<HTMLFormElement>` instead of the deprecated `FormEvent<any>`, both from `react`. `FormEvent` doesn't correspond to a real event type and is annotated `@deprecated` in `@types/react` in favor of `SubmitEvent`, `ChangeEvent`, `InputEvent`, or `SyntheticEvent`.

```diff
-import type { FormEvent } from 'react';
+import type { SubmitEvent } from 'react';

-function handleSubmit(data: IChangeEvent, event: FormEvent<any>) {
+function handleSubmit(data: IChangeEvent, event: SubmitEvent<HTMLFormElement>) {
```

`SubmitEvent` needs `@types/react` 19.2.18 or later; see [@types/react 19.2.18 or later is required](./types-react-19-2-18-required.md).

## Verify

- Your `onSubmit` handler compiles.
