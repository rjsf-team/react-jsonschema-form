import type { ValidationError, Validator, ValidatorOptions } from 'ata-validator';

/** Custom format checker. Receives a string and returns true when the value
 * is considered valid for this format. Mirrors the function shape used by
 * `ata-validator`'s `formats` option.
 */
export type AtaFormatChecker = (value: string) => boolean;

/** Controls which duplicate error filtering is suppressed; see
 * `processRawValidationErrors#filterDuplicateErrors` for the full semantics.
 * Mirrors `@rjsf/validator-ajv8`'s option of the same name.
 */
export type SuppressDuplicateFilteringType = 'anyOf' | 'oneOf' | 'all' | 'none';

/** A function that takes a list of `ata-validator` `ValidationError`s and
 * mutates them in place (or replaces messages) to produce localized output.
 * Same shape as the AJV-validator `Localizer`, except the input type is
 * `ata-validator`'s `ValidationError` rather than ajv's `ErrorObject`.
 */
export type Localizer = (errors?: null | ValidationError[]) => void;

/** Options used to customize the underlying `ata-validator` instance.
 *
 * The shape mirrors `@rjsf/validator-ajv8`'s `CustomValidatorOptionsType`
 * where there is a direct correspondence; AJV-only knobs (`AjvClass`,
 * `ajvFormatOptions`, `ajvOptionsOverrides`) are intentionally omitted
 * because they don't map to ata's API. `extenderFn` is preserved so users
 * can run arbitrary setup against the constructed `Validator`.
 */
export interface CustomValidatorOptionsType {
  /** Additional schemas registered for cross-schema `$ref` resolution.
   * Mirrors `ajv.addMetaSchema` / `ajv.addSchema` semantics; ata resolves
   * `$ref` against the registered set.
   */
  additionalMetaSchemas?: readonly object[];

  /** Custom format checkers. Keys are format names referenced from `format`
   * in the schema. Values are validation functions, RegExps, or pre-anchored
   * regex source strings (compiled into a function for ata).
   */
  customFormats?: Record<string, string | RegExp | AtaFormatChecker>;

  /** Overrides spread on top of the default `ata-validator` options. Use this
   * to flip `coerceTypes`, `removeAdditional`, `verbose`, or `abortEarly`.
   */
  ataOptionsOverrides?: ValidatorOptions;

  /** Hook for applying additional setup against a freshly-built `Validator`.
   * Returning a different instance is supported.
   */
  extenderFn?: (validator: Validator) => Validator;

  /** Suppress duplicate error filtering for the specified keyword(s). See
   * `processRawValidationErrors#filterDuplicateErrors`.
   */
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType;
}

/** The simplified `ValidateFunction` shape produced by ata's compiled
 * standalone modules. Kept for symmetry with the AJV validator package and
 * for the upcoming precompiled-validator support; not consumed by the
 * runtime path in this initial release.
 */
export interface CompiledValidateFunction {
  errors?: null | ValidationError[];
  (data: unknown): boolean;
}

export type ValidatorFunctions = Record<string, CompiledValidateFunction>;
