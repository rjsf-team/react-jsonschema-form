import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { schemaParser } from '@rjsf/utils';
import { Validator } from 'ata-validator';

import { ATA_CONFIG, COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from './createAtaInstance.ts';
import { declaredId, schemaList } from './schemaList.ts';
import type { CustomValidatorOptionsType } from './types.ts';

const warned = new Set<string>();

/** Logs each distinct warning once per process, so compiling on every request does not
 * repeat it.
 */
function warnOnce(message: string) {
  if (!warned.has(message)) {
    warned.add(message);
    // oxlint-disable-next-line no-console
    console.warn(message);
  }
}

/** Compiles a schema into a precompiled validator module. ata's
 * `bundleStandalone` emits `module.exports = [fn, ...]`, one validator per
 * schema in order, where each `fn(data)` returns `{ valid, errors }`. This wraps
 * that array into the `{ [id]: (data) => boolean }`-with-`errors` map that
 * `createPrecompiledValidator` consumes, keyed the same way `schemaParser` keys
 * the schemas so the precompiled validator can look each one up.
 *
 * `customFormats` (as RegExps or pattern strings) and `ataOptionsOverrides` are passed to
 * ata. `additionalMetaSchemas` and `ataOptionsOverrides.schemas` that have an `$id` are
 * compiled into the module as the runtime validator ends up with them (a later one replacing an
 * earlier one with the same `$id`), so a custom meta-schema named in `$schema` applies there too.
 * An official json-schema.org meta-schema passed in explicitly is compiled in as well, with a
 * `console.warn`, since ata already ships them and one adds about 92 KB for draft-07's.
 * Extra schemas without an `$id` are left out with a `console.warn`, as ata requires one.
 * A few options cannot be carried into a standalone module: `extenderFn` and the
 * `ataOptionsOverrides` keys `coerceTypes`, `removeAdditional` and `keywords`. Those are left
 * out with a `console.warn`, once per process, since the module and the runtime validator may
 * then disagree in either direction. The module also never fills in `default` values, so
 * where the runtime validator would fill a missing required field from its default, the module
 * rejects it. `suppressDuplicateFiltering` is given to `createPrecompiledValidator()` instead.
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

  const { customFormats, additionalMetaSchemas = [], extenderFn, ataOptionsOverrides = {} } = options;
  // What the module cannot carry is left out. `engine` only picks how the runtime validator
  // answers, never what it answers, and a standalone module is generated code by definition.
  const {
    coerceTypes,
    removeAdditional,
    keywords,
    schemas: extraSchemas = {},
    engine: _engine,
    ...carried
  } = ataOptionsOverrides;
  // Extra schemas with an `$id` go into the bundle after the form's own schemas, so a custom
  // meta-schema or a `$ref` between them resolves there too. They get no entry in the exported map.
  // ata registers a record entry under its key and under its own `$id`, so both are compiled.
  // In the order the runtime validator registers them: `ataOptionsOverrides.schemas` when it is
  // built, then each of `additionalMetaSchemas` through `addSchema`.
  const extras = [...schemaList(extraSchemas), ...additionalMetaSchemas];
  const withId = extras.filter((extra) => declaredId(extra) !== undefined);
  // Every document the runtime validator ends up with goes into the module, so the two resolve the
  // same documents by construction. A later document replaces an earlier one with the same `$id`
  // there, so only the last one of each `$id` is kept.
  const winners = new Map<string, object>();
  for (const extra of withId) {
    const id = (extra as { $id: string }).$id;
    winners.delete(id);
    winners.set(id, extra);
  }
  const bundled = [...winners.values()];
  // An official meta-schema passed in explicitly is compiled in too, about 92 KB for draft-07's.
  // ata ships its own copies, so one is only worth passing when it has been changed.
  for (const id of winners.keys()) {
    if (/^https?:\/\/json-schema\.org\//.test(id)) {
      warnOnce(
        `@rjsf/validator-ata: ${id} is compiled into the precompiled module (about 92 KB for draft-07's); ata already ships the official meta-schemas, so pass one only if you changed it`,
      );
    }
  }
  if (withId.length < extras.length) {
    warnOnce(
      '@rjsf/validator-ata: additionalMetaSchemas and ataOptionsOverrides.schemas entries without an $id are ignored; ata requires an $id, so customizeValidator() throws for them',
    );
  }
  const dropped = [
    ...(extenderFn ? ['extenderFn'] : []),
    ...(coerceTypes ? ['ataOptionsOverrides.coerceTypes'] : []),
    ...(removeAdditional ? ['ataOptionsOverrides.removeAdditional'] : []),
    ...(keywords && Object.keys(keywords).length ? ['ataOptionsOverrides.keywords'] : []),
  ];
  if (dropped.length > 0) {
    warnOnce(
      `@rjsf/validator-ata: ${dropped.join(', ')} cannot be carried into a precompiled validator and ${dropped.length === 1 ? 'is' : 'are'} ignored; the precompiled and runtime validators may disagree`,
    );
  }
  if (options.suppressDuplicateFiltering !== undefined) {
    warnOnce(
      '@rjsf/validator-ata: suppressDuplicateFiltering has no effect at compile time; pass it to createPrecompiledValidator() instead',
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

  const bundle = Validator.bundleStandalone([...schemas, ...bundled], {
    ...ATA_CONFIG,
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
