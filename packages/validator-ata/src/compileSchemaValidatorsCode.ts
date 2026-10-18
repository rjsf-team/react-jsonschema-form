import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { schemaParser } from '@rjsf/utils';
import type { ValidatorOptions } from 'ata-validator';
import { Validator } from 'ata-validator';

import { COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance.ts';
import type { CustomValidatorOptionsType } from './types.ts';

/** Compiles a schema into a precompiled validator module. ata's
 * `bundleStandalone` emits `module.exports = [fn, ...]`, one validator per
 * schema in order, where each `fn(data)` returns `{ valid, errors }`. This wraps
 * that array into the `{ [id]: (data) => boolean }`-with-`errors` map that
 * `createPrecompiledValidator` consumes, keyed the same way `schemaParser` keys
 * the schemas so the precompiled validator can look each one up.
 *
 * `customFormats` (as RegExps or pattern strings) and `ataOptionsOverrides` are passed to
 * ata, so the module validates as the runtime validator with the same options does. A few
 * options cannot be carried into a standalone module: `extenderFn`, `additionalMetaSchemas`,
 * and the `ataOptionsOverrides` keys `coerceTypes`, `removeAdditional`, `keywords` and
 * `schemas`. Those are left out with a `console.warn`, since the module may then reject
 * data the runtime validator accepts. `suppressDuplicateFiltering` is given to
 * `createPrecompiledValidator()` instead.
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

  const { customFormats, additionalMetaSchemas, extenderFn, ataOptionsOverrides = {} } = options;
  const { coerceTypes, removeAdditional, keywords, schemas: extraSchemas } = ataOptionsOverrides;
  // What the module cannot carry is left out. `engine` only picks how the runtime validator
  // answers, never what it answers, and a standalone module is generated code by definition.
  const carried: ValidatorOptions = { ...ataOptionsOverrides };
  for (const key of ['coerceTypes', 'removeAdditional', 'keywords', 'schemas', 'engine'] as const) {
    delete carried[key];
  }
  const dropped = [
    ...(extenderFn ? ['extenderFn'] : []),
    ...(additionalMetaSchemas?.length ? ['additionalMetaSchemas'] : []),
    ...(coerceTypes ? ['ataOptionsOverrides.coerceTypes'] : []),
    ...(removeAdditional ? ['ataOptionsOverrides.removeAdditional'] : []),
    ...(keywords && Object.keys(keywords).length ? ['ataOptionsOverrides.keywords'] : []),
    ...(extraSchemas && Object.keys(extraSchemas).length ? ['ataOptionsOverrides.schemas'] : []),
  ];
  if (dropped.length > 0) {
    // oxlint-disable-next-line no-console
    console.warn(
      `@rjsf/validator-ata: ${dropped.join(', ')} cannot be carried into a precompiled validator and ${dropped.length === 1 ? 'is' : 'are'} ignored; the precompiled validator may reject data the runtime validator accepts`,
    );
  }

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
    // `new Function` rather than a fat-arrow on purpose: ata serializes these format
    // checkers into the standalone bundle via Function#toString. A fat-arrow would
    // close over `re` and emit `re.test(value)`, leaving `re` undefined in the
    // generated module. Building it from a string inlines the regex literal into the
    // body, so the bundled output stays self-contained.
    // oxlint-disable-next-line no-new-func, no-implied-eval
    formats[name] = new Function('value', `return ${re.toString()}.test(value)`) as (value: string) => boolean;
  }

  const bundle = Validator.bundleStandalone(schemas, {
    verbose: true,
    ...carried,
    format: 'cjs',
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
