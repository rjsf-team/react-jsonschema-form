import type { Validator } from 'ata-validator';
import { CustomValidatorOptionsType } from '../../src';

/** Shared option fixture used across the validator-ata test suite. The
 * shape mirrors the corresponding fixture in `@rjsf/validator-ajv8` where
 * each option has a meaningful translation; AJV-only knobs (`AjvClass`,
 * `ajvFormatOptions`, `ajvOptionsOverrides`) drop out and ata-equivalent
 * keys (`ataOptionsOverrides`) take their place.
 */
export const CUSTOM_OPTIONS: CustomValidatorOptionsType = {
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
    'area-code': /\d{3}/,
  },
  ataOptionsOverrides: {
    verbose: true,
  },
  extenderFn: (validator: Validator) => validator,
};
