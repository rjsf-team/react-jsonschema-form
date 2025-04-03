/**
 * In order to keep things in sync, it may be necessary to run this after making changes in the schemaParser world in
 * `@rjsf/utils` OR if an AJV update is installed. To run this, simply do the following, starting in the root directory
 * of the `@rjsf/validator-ajv8` directory:
 *
 * - cd test/harness
 * - node compileTestSchema.js
 *
 * Then add the two updated `superSchema.cjs` and `superSchemaOptions.cjs` files to your PR
 */
import { RJSFSchema } from '@rjsf/utils';
import additionalMetaSchema from 'ajv/lib/refs/json-schema-draft-06.json';

import compileSchemaValidators from '../../src/compileSchemaValidators';
import superSchemaObj from './superSchema.json';
import { CustomValidatorOptionsType } from '../../src';

const superSchema = superSchemaObj as unknown as RJSFSchema;

// NOTE these are the same as the CUSTOM_OPTIONS in `testData.ts`, keep them in sync
const options: CustomValidatorOptionsType = {
  additionalMetaSchemas: [additionalMetaSchema],
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
    'area-code': /\d{3}/,
  },
  ajvOptionsOverrides: { $data: true, verbose: true, code: { lines: false } },
  ajvFormatOptions: {
    mode: 'fast',
  },
};

// Since these are expected to be run via the `npm run compileSchemas` script from the root directory add the output
// path to the directory where this file resides
compileSchemaValidators(superSchema, './test/harness/superSchema.cjs');

compileSchemaValidators(superSchema, './test/harness/superSchemaOptions.cjs', options);
