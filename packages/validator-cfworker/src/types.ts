import type { OutputUnit, Schema, SchemaDraft, Validator } from '@cfworker/json-schema';

export type CFWorkerFormatChecker = (value: string) => boolean;

export type SuppressDuplicateFilteringType = 'anyOf' | 'oneOf' | 'all' | 'none';

/** Options for the `@cfworker/json-schema` backed validator. */
export interface CustomValidatorOptionsType {
  /** Additional schemas registered for cross-schema `$ref` resolution. */
  additionalMetaSchemas?: readonly Schema[];

  /** Custom format checkers installed in the engine's format registry. */
  customFormats?: Record<string, string | RegExp | CFWorkerFormatChecker>;

  /** JSON Schema dialect used by the engine. Defaults to `2020-12`. */
  draft?: SchemaDraft;

  /** Hook for applying additional setup to each constructed validator. */
  extenderFn?: (validator: Validator) => Validator;

  /** Stop after the first validation error. Defaults to `false`. */
  shortCircuit?: boolean;

  /** Controls duplicate `anyOf`/`oneOf` error filtering. */
  suppressDuplicateFiltering?: SuppressDuplicateFilteringType;
}

/** Error object returned by `@cfworker/json-schema`. */
export type CFWorkerValidationError = OutputUnit;
