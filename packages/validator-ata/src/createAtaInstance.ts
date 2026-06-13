import type { ValidatorOptions } from 'ata-validator';
import { Validator } from 'ata-validator';
import isObject from 'lodash/isObject';

import type { AtaFormatChecker, CustomValidatorOptionsType } from './types';

/** Default options applied to every ata `Validator` constructed for RJSF.
 * `verbose: true` keeps `parentSchema` available on errors, which the RJSF
 * error transformer uses to recover field titles. The remainder match
 * `@rjsf/validator-ajv8`'s defaults (`allErrors`-equivalent behavior is
 * ata's default).
 */
export const ATA_CONFIG: ValidatorOptions = {
  verbose: true,
} as const;

/** Color names + hex + `rgb()` regex source. Mirrors the pattern shipped by
 * `@rjsf/validator-ajv8` so RJSF schemas using `format: 'color'` keep
 * working when swapped to validator-ata.
 */
export const COLOR_FORMAT_REGEX =
  /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/;

/** RFC 2397 data URL with required mime type and base64 marker, matching
 * the shape used by `@rjsf/validator-ajv8`.
 */
export const DATA_URL_FORMAT_REGEX = /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/;

/** Coerces the user-supplied custom format value into the `(value: string)
 * => boolean` shape expected by ata. Strings are treated as RegExp source
 * (anchored at both ends if not already), RegExps are converted to a `.test`
 * call, functions pass through.
 */
function asFormatChecker(spec: string | RegExp | AtaFormatChecker): AtaFormatChecker {
  if (typeof spec === 'function') {
    return spec;
  }
  const re = spec instanceof RegExp ? spec : new RegExp(spec);
  return (value: string) => re.test(value);
}

/** Builds a fresh `ata-validator` `Validator` for a given schema with all
 * RJSF-aware defaults and user customizations applied.
 *
 * The factory exists so that the validator class can construct one
 * `Validator` per schema-id (ata is schema-bound, unlike AJV's single
 * instance with a schema registry) while keeping the option translation
 * in one place.
 */
export default function createAtaInstance(schema: object, options: CustomValidatorOptionsType = {}): Validator {
  const { customFormats, ataOptionsOverrides, additionalMetaSchemas, extenderFn } = options;

  const formats: Record<string, AtaFormatChecker> = {
    color: asFormatChecker(COLOR_FORMAT_REGEX),
    'data-url': asFormatChecker(DATA_URL_FORMAT_REGEX),
  };
  if (isObject(customFormats)) {
    for (const [name, spec] of Object.entries(customFormats)) {
      formats[name] = asFormatChecker(spec);
    }
  }

  const validatorOptions: ValidatorOptions = {
    ...ATA_CONFIG,
    ...ataOptionsOverrides,
    formats,
  };

  let validator = new Validator(schema, validatorOptions);

  if (Array.isArray(additionalMetaSchemas)) {
    for (const meta of additionalMetaSchemas) {
      validator.addSchema(meta);
    }
  }

  if (typeof extenderFn === 'function') {
    validator = extenderFn(validator);
  }

  return validator;
}
