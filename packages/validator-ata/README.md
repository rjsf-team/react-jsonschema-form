[![Apache 2.0 License][license-shield]][license-url]

<br />
<p align="center">
  <a href="https://github.com/rjsf-team/react-jsonschema-form">
    <h3 align="center">@rjsf/validator-ata</h3>
  </a>

  <p align="center">
  <a href="https://github.com/ata-core/ata-validator">ata-validator</a> based validator plugin for <a href="https://github.com/rjsf-team/react-jsonschema-form/"><code>react-jsonschema-form</code></a>.
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/docs/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://rjsf-team.github.io/react-jsonschema-form/">View Playground</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Report Bug</a>
    ·
    <a href="https://github.com/rjsf-team/react-jsonschema-form/issues">Request Feature</a>
  </p>
</p>

## Table of Contents

- [About](#about)
- [Installation](#installation)
- [Usage](#usage)
- [Customization](#customization)
- [Precompiled validators](#precompiled-validators)
- [Differences from validator-ajv8](#differences-from-validator-ajv8)

## About

`@rjsf/validator-ata` plugs [`ata-validator`](https://github.com/ata-core/ata-validator) into `react-jsonschema-form` as a drop-in alternative to `@rjsf/validator-ajv8`. The public API mirrors `validator-ajv8` so swapping is a one-line change in the validator import. Error format, custom-format hook, custom validation, and error transformation all work the same way.

ata is a JSON Schema validator that targets Draft 2020-12 (98.5% spec compliance, 95.3% schemasafe pass rate) and is Standard Schema compliant. Its differentiators relative to AJV: pattern checks are RE2-backed (no ReDoS surface), and schemas can be compiled at build time for environments where bundle size or CSP restricts runtime codegen.

## Installation

```bash
npm install @rjsf/validator-ata ata-validator
```

`ata-validator` is a peer of this package; install it alongside.

## Usage

```ts
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ata';

<Form schema={schema} validator={validator} />;
```

### Customization

```ts
import { customizeValidator } from '@rjsf/validator-ata';

const validator = customizeValidator({
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
    'area-code': /\d{3}/,
  },
  ataOptionsOverrides: {
    verbose: true,
  },
});
```

`customizeValidator` accepts:

- **`customFormats`** — same shape as `validator-ajv8`. Values may be a `RegExp`, an anchored regex source string, or a `(value: string) => boolean` predicate.
- **`ataOptionsOverrides`** — plain `ata-validator` options spread on top of the defaults; use this to flip `coerceTypes`, `removeAdditional`, `verbose`, or `abortEarly`.
- **`additionalMetaSchemas`** — extra schemas registered via `Validator#addSchema` for cross-schema `$ref` resolution.
- **`extenderFn`** — hook applied against a freshly-built `Validator` (e.g. for adding additional formats or schemas in one place).
- **`suppressDuplicateFiltering`** — passthrough to the RJSF error processor; same semantics as in `validator-ajv8`.

A `Localizer` may be supplied as the second argument. ata error objects use the same field names as AJV (`keyword`, `instancePath`, `schemaPath`, `params`, `message`, `parentSchema`), so localizers that mutate `message` in place port across without changes. The pre-quote dance that the AJV validator runs against `ajv-i18n` is intentionally not replicated here — ata's error params are frozen, and the existing locale catalogues for AJV are not portable to ata's keyword set.

## Precompiled validators

If your schema is known at build time, you can compile it to plain JavaScript and ship the generated module instead of the validator. This works like `validator-ajv8`'s precompiled validators.

1. Generate the module in a build script (Node only):

```ts
import fs from 'node:fs';
import { compileSchemaValidatorsCode } from '@rjsf/validator-ata/compileSchemaValidators';
import schema from './schema.json' with { type: 'json' };

fs.writeFileSync('./src/precompiled-validator.cjs', compileSchemaValidatorsCode(schema));
```

2. Use it in the app:

```ts
import { createPrecompiledValidator } from '@rjsf/validator-ata';
import validateFns from './precompiled-validator.cjs';
import schema from './schema.json';

const validator = createPrecompiledValidator(validateFns, schema);
```

The generated module imports nothing, so ata-validator is not in your bundle. Measured on a sign-up form (React 19, esbuild, minified and gzipped): the whole app is 290.2 KB with the runtime validator and 163.0 KB with the precompiled one; the same app without any validator is 156.4 KB. Custom formats must be a `RegExp` or a pattern string here, not a function. Run the build step again when the schema changes.

## Differences from validator-ajv8

The `ValidatorType` contract is identical, and the shared `@rjsf/utils` schema test suite passes against this validator with the deltas below. Behavior outside of this list mirrors `validator-ajv8`.

- **`ajvOptionsOverrides`, `ajvFormatOptions`, `AjvClass`** have no equivalents and are intentionally not accepted. `ataOptionsOverrides` replaces the first; built-in formats are always installed and don't require an opt-in flag.
- **`isValid` and `rawValidation` deep-clone `formData` before passing it to ata**. ata's default-applier writes `default` values into the input object during validation, while AJV treats validation as a pure operation. The clone preserves the AJV contract RJSF expects when probing data through repeated `isValid` calls (oneOf/anyOf option resolution).
- **Custom-keyword extensions** (e.g. `ajv-errors`, `ajv-merge-patch`) have no ata-side counterpart yet. Schemas using these keywords will validate (ata silently ignores unknown keywords) but the extension semantics are not applied.

## Contributing

See the monorepo [CONTRIBUTING.md](../../CONTRIBUTING.md). Issues and PRs welcome on either the validator package or [ata-validator](https://github.com/ata-core/ata-validator) itself.

[license-shield]: https://img.shields.io/badge/license-Apache%202.0-blue
[license-url]: https://github.com/rjsf-team/react-jsonschema-form/blob/main/LICENSE.md
