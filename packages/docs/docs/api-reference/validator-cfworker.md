# @rjsf/validator-cfworker APIs

`@rjsf/validator-cfworker` is an additional, eval-free validator option for CSP-constrained applications. It is backed by [`@cfworker/json-schema`](https://github.com/cfworker/cfworker/tree/main/packages/json-schema), interprets schemas without `eval` or `new Function`, and defaults to JSON Schema draft 2020-12.

It is not an AJV replacement. See the package [README](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/validator-cfworker) for the unsupported-keyword matrix and current upstream-state notes.

## Differences from `@rjsf/validator-ajv8`

- AJV-only options and extensions such as `AjvClass`, `$data`, `discriminator`, and `ajv-errors`'s `errorMessage` are not supported.
- `$dynamicRef` and `$dynamicAnchor` are not currently supported by the underlying engine.
- Error messages differ from AJV, and there is no `ajv-i18n` localizer equivalent. Use `transformErrors` to customize messages.
- Precompiled-validator mode is not part of this initial package.
- The wrapper normalizes `undefined` form-data values before validation and caches validators by schema id to make repeated RJSF `isValid()` calls safe.

## Types

The package exports `CustomValidatorOptionsType`, `CFWorkerValidationError`, `CFWorkerFormatChecker`, and `SuppressDuplicateFilteringType` from [`src/types.ts`](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/validator-cfworker/src/types.ts).

## APIs

### `customizeValidator<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()`

Creates a `ValidatorType<T, S, F>` backed by `@cfworker/json-schema`.

#### Parameters

- `options.additionalMetaSchemas`: additional schemas registered for cross-schema `$ref` resolution
- `options.customFormats`: format checkers expressed as functions, regular expressions, or regular-expression source strings
- `options.draft`: `'4'`, `'7'`, `'2019-09'`, or `'2020-12'`; defaults to `'2020-12'`
- `options.extenderFn`: hook called with every newly constructed engine validator
- `options.shortCircuit`: stop at the first error; defaults to `false`
- `options.suppressDuplicateFiltering`: `'none'`, `'anyOf'`, `'oneOf'`, or `'all'`

#### Returns

- `ValidatorType<T, S, F>`: the customized validator implementation

```ts
import { customizeValidator } from '@rjsf/validator-cfworker';

const validator = customizeValidator({
  draft: '2020-12',
  customFormats: { slug: /^[a-z0-9-]+$/ },
});
```
