import { CustomValidatorOptionsType } from '../../src';

// NOTE these are the same as the CUSTOM_OPTIONS in `compileTestSchema.js`, keep them in sync
export const CUSTOM_OPTIONS: CustomValidatorOptionsType = {
  additionalMetaSchemas: [require('ajv/lib/refs/json-schema-draft-06.json')],
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
    'area-code': /\d{3}/,
  },
  ajvOptionsOverrides: {
    $data: true,
    verbose: true,
  },
  ajvFormatOptions: {
    mode: 'fast',
  },
};
