# @rjsf/validator-cfworker

`@rjsf/validator-cfworker` is an additional validator option for CSP-constrained RJSF users. It uses [`@cfworker/json-schema`](https://github.com/cfworker/cfworker/tree/main/packages/json-schema) to interpret schemas without `eval` or `new Function`, and defaults to JSON Schema draft 2020-12.

It is not an AJV replacement. Choose it when an eval-free runtime is more important than AJV-specific keywords, extensions, localization, or code generation.

```tsx
import Form from '@rjsf/core';
import validator from '@rjsf/validator-cfworker';

export default function Example() {
  return <Form schema={{ type: 'string' }} validator={validator} />;
}
```

## Behavior

- Implements RJSF's `ValidatorType<T, S, F>` interface.
- Normalizes `undefined` before validation: undefined object members are omitted so `required` errors surface, while undefined array entries become `null`.
- Caches schema-bound engine instances by schema `$id` (or the RJSF schema hash) and refreshes them when the schema or root schema changes.
- Supports `customValidate`, `transformErrors`, custom formats, duplicate `anyOf`/`oneOf` filtering, and the RJSF `color` and `data-url` formats.
- Supports draft 4, draft 7, draft 2019-09, and draft 2020-12 through the `draft` customization option; the default is draft 2020-12.

```ts
import { customizeValidator } from '@rjsf/validator-cfworker';

const validator = customizeValidator({
  draft: '2020-12',
  shortCircuit: false,
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
  },
});
```

## Unsupported-keyword matrix

Unknown keywords are annotations to the underlying engine, so unsupported extensions are not validation constraints.

| Keyword or extension | Status | Notes |
| --- | --- | --- |
| `$dynamicRef` / `$dynamicAnchor` | Unsupported | Tracked upstream in [`cfworker/json-schema#150`](https://github.com/cfworker/cfworker/issues/150). |
| AJV `$data` references | Unsupported | AJV-specific extension; use literal schema values. |
| OpenAPI `discriminator` | Unsupported | Use standard `oneOf` constraints without discriminator semantics. |
| `errorMessage` from `ajv-errors` | Unsupported | Use RJSF's `transformErrors` hook instead. |

Precompiled-validator mode is intentionally outside this initial package. Runtime error messages also differ from AJV, and there is no `ajv-i18n` equivalent.

## Upstream state and provenance

This package is ported from [`glama-ai/rjsf-validator-cfworker`](https://github.com/glama-ai/rjsf-validator-cfworker), whose structure was intentionally kept compatible with RJSF. The original MIT copyright and license are preserved in [LICENSE](./LICENSE); the RJSF integration and subsequent changes are distributed under the monorepo's Apache-2.0 license.

The underlying `@cfworker/json-schema` package's latest release is from January 2025. Its tracker includes open correctness reports for duplicate schema URIs ([#335](https://github.com/cfworker/cfworker/issues/335)) and `additionalProperties` behavior ([#336](https://github.com/cfworker/cfworker/issues/336)), as well as the `$dynamicRef` gap above. This wrapper's per-schema cache avoids repeat registration on RJSF's `isValid` path, but it does not change the upstream engine's other semantics. The package is therefore presented as an additional option for CSP-constrained users.
