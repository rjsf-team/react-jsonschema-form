---
title: A bare UiSchema no longer fits a form whose data has a narrow index signature
description: A bare `UiSchema` or `UiSchema<GenericObjectType>` no longer fits a form whose data, or array element, has a string index signature narrower than `unknown`, such as `Record<string, string>`. Annotate the uiSchema with the data it describes.
packages: ['@rjsf/utils']
uses: [typescript, ui-schema]
schema: []
affects: [code]
related: [ui-schema-entries-are-unknown, form-data-type-defaults-to-unknown]
---

## Detect

- In your code: a bare `UiSchema` or a `UiSchema<GenericObjectType>` passed as the `uiSchema` of a `Form` whose `formData` is a `Record<string, string>`, a `Record<string, string>[]` or similar.
- In your code: a `UiSchema<{ meta: any }>` used where a `UiSchema<{ meta: string }>`, or any other type for `meta`, is expected.
- The type checker reports `Type '…' is not assignable to type '…'.` (TS2322) on that `uiSchema`.

## Change

Each key of that index signature holds a `UiSchema` for its value, which the `unknown` entries of an untyped `UiSchema` don't fit; see [Entries read from an untyped UiSchema are unknown](./ui-schema-entries-are-unknown.md). A `Record<string, unknown>` target is fine, since its entries are as open as the untyped one's. Annotate the uiSchema with the data it describes:

```diff
-const uiSchema: UiSchema = { notes: { 'ui:widget': 'textarea' } };
+const uiSchema: UiSchema<Record<string, string>> = { notes: { 'ui:widget': 'textarea' } };
```

## Verify

- The type checker accepts the `uiSchema` on the form.
- Nothing changes at runtime.
