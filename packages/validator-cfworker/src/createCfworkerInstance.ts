import * as CFWorkerJsonSchema from '@cfworker/json-schema';
import type { Schema } from '@cfworker/json-schema';
import { Validator } from '@cfworker/json-schema';
import cloneDeep from 'lodash/cloneDeep';

import type { CFWorkerFormatChecker, CustomValidatorOptionsType } from './types';

export const COLOR_FORMAT_REGEX =
  /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/;

export const DATA_URL_FORMAT_REGEX = /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/;

interface FormatRegistryModule {
  format?: Record<string, CFWorkerFormatChecker>;
}

function asFormatChecker(spec: string | RegExp | CFWorkerFormatChecker): CFWorkerFormatChecker {
  if (typeof spec === 'function') {
    return spec;
  }
  const regex = spec instanceof RegExp ? spec : new RegExp(spec);
  return (value: string) => regex.test(value);
}

export function installFormats(
  customFormats: CustomValidatorOptionsType['customFormats'],
  targetRegistry = (CFWorkerJsonSchema as unknown as FormatRegistryModule).format,
): void {
  // `format` is a runtime export in @cfworker/json-schema 4.1.1, although its
  // generated declaration file omits it. The engine reads this registry while
  // validating, so adding entries here is its supported runtime extension seam.
  if (!targetRegistry) {
    throw new Error('@cfworker/json-schema did not expose its format registry');
  }

  const registry = targetRegistry;
  registry.color = asFormatChecker(COLOR_FORMAT_REGEX);
  registry['data-url'] = asFormatChecker(DATA_URL_FORMAT_REGEX);
  for (const [name, spec] of Object.entries(customFormats ?? {})) {
    registry[name] = asFormatChecker(spec);
  }
}

/** Builds a schema-bound `@cfworker/json-schema` validator. */
export default function createCfworkerInstance(
  schema: Schema | boolean,
  options: CustomValidatorOptionsType = {},
  rootSchema?: Schema,
): Validator {
  const { additionalMetaSchemas, customFormats, draft = '2020-12', extenderFn, shortCircuit = false } = options;

  installFormats(customFormats);
  // The engine annotates schemas during dereferencing. Clone every user-owned
  // schema so frozen RJSF fixtures and application schemas remain untouched.
  let validator = new Validator(cloneDeep(schema), draft, shortCircuit);

  for (const additionalSchema of additionalMetaSchemas ?? []) {
    validator.addSchema(cloneDeep(additionalSchema), additionalSchema.$id);
  }
  if (rootSchema && rootSchema !== schema) {
    validator.addSchema(cloneDeep(rootSchema), rootSchema.$id);
  }
  if (typeof extenderFn === 'function') {
    validator = extenderFn(validator);
  }
  return validator;
}
