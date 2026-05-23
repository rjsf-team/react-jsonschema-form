import { RJSFSchema, StrictRJSFSchema, schemaParser } from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { CustomValidatorOptionsType } from './types';
import { COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance';

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

  // Format checkers are serialized into the standalone module via Function#toString,
  // so they must carry no closure references or build-time instrumentation (a plain
  // arrow over the source file picks up coverage counters). Building each from its
  // regex via `new Function` produces a function whose source is exactly its body.
  const regexFormats: Record<string, RegExp> = {
    color: COLOR_FORMAT_REGEX,
    'data-url': DATA_URL_FORMAT_REGEX,
  };
  if (customFormats) {
    for (const [name, check] of Object.entries(customFormats)) {
      if (typeof check === 'function') {
        // A function checker would be serialized via toString, which is unsafe in a
        // precompiled bundle: transpilers, minifiers, and coverage tools rewrite the
        // body and leave references that do not exist in the generated module. Only
        // RegExp/string patterns can be embedded reliably here.
        throw new Error(
          `@rjsf/validator-ata: custom format "${name}" is a function, which is not supported by the precompiled validator; provide a RegExp or string pattern instead`,
        );
      }
      regexFormats[name] = typeof check === 'string' ? new RegExp(check) : check;
    }
  }
  const formats: Record<string, (value: string) => boolean> = {};
  for (const [name, re] of Object.entries(regexFormats)) {
    // eslint-disable-next-line no-new-func
    formats[name] = new Function('value', `return ${re.toString()}.test(value)`) as (value: string) => boolean;
  }

  const bundle = Validator.bundleStandalone(schemas, {
    format: 'cjs',
    verbose: ataOptionsOverrides.verbose !== false,
    formats,
  });

  const entries = keys
    .map((key, index) => `  ${JSON.stringify(key)}: wrap(validators[${index}], ${JSON.stringify(key)}),`)
    .join('\n');

  return [
    'const validators = (function () {',
    '  const module = { exports: {} };',
    bundle,
    '  return module.exports;',
    '})();',
    'function wrap(fn, key) {',
    '  function validate(data) {',
    "    if (typeof fn !== 'function') {",
    "      throw new Error('@rjsf/validator-ata: schema \"' + key + '\" was not compiled to a standalone validator');",
    '    }',
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
