import { RJSFSchema, StrictRJSFSchema, schemaParser } from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { CustomValidatorOptionsType } from './types';

/** Compiles a schema into a precompiled validator module. ata's
 * `bundleStandalone` emits `module.exports = [fn, ...]`, one validator per
 * schema in order, where each `fn(data)` returns `{ valid, errors }`. This wraps
 * that array into the `{ [id]: (data) => boolean }`-with-`errors` map that
 * `createPrecompiledValidator` consumes, keyed the same way `schemaParser` keys
 * the schemas so the precompiled validator can look each one up.
 *
 * @param schema - The schema to compile
 * @param [options={}] - The `CustomValidatorOptionsType` used to build the validator
 */
export function compileSchemaValidatorsCode<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  options: CustomValidatorOptionsType = {},
) {
  const schemaMaps = schemaParser(schema);
  const keys = Object.keys(schemaMaps);
  const schemas = Object.values(schemaMaps);

  const { customFormats, ataOptionsOverrides = {} } = options;
  const formats = customFormats
    ? Object.fromEntries(
        Object.entries(customFormats).map(([name, check]) => {
          if (typeof check === 'function') {
            return [name, check];
          }
          const re = typeof check === 'string' ? new RegExp(check) : check;
          return [name, (value: string) => re.test(value)];
        }),
      )
    : undefined;

  const bundle = Validator.bundleStandalone(schemas, {
    format: 'cjs',
    verbose: ataOptionsOverrides.verbose === true,
    ...(formats ? { formats } : {}),
  });

  const entries = keys.map((key, index) => `  ${JSON.stringify(key)}: wrap(validators[${index}]),`).join('\n');

  return [
    'const validators = (function () {',
    '  const module = { exports: {} };',
    bundle,
    '  return module.exports;',
    '})();',
    'function wrap(fn) {',
    '  function validate(data) {',
    '    const result = fn(data);',
    '    validate.errors = result.valid ? null : result.errors;',
    '    return result.valid;',
    '  }',
    '  return validate;',
    '}',
    'module.exports = {',
    entries,
    '};',
    '',
  ].join('\n');
}
