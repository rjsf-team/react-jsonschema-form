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

  // bundleStandalone serializes format functions via toString(), so each function
  // must be self-contained (no references to outer-scope variables).
  // eslint-disable-next-line no-useless-escape
  const formats: Record<string, (value: string) => boolean> = {
    // eslint-disable-next-line no-useless-escape
    color: (v: string) =>
      /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/.test(
        v,
      ),
    'data-url': (v: string) => /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/.test(v),
  };
  if (customFormats) {
    for (const [name, check] of Object.entries(customFormats)) {
      if (typeof check === 'function') {
        formats[name] = check;
      } else {
        const src = typeof check === 'string' ? check : check.source;
        const flags = typeof check === 'string' ? '' : check.flags;
        // Wrap in a self-contained function so toString() bakes in the literal.
        formats[name] = new Function(
          'v',
          `return new RegExp(${JSON.stringify(src)}, ${JSON.stringify(flags)}).test(v)`,
        ) as (value: string) => boolean;
      }
    }
  }

  const bundle = Validator.bundleStandalone(schemas, {
    format: 'cjs',
    verbose: ataOptionsOverrides.verbose !== false,
    formats,
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
