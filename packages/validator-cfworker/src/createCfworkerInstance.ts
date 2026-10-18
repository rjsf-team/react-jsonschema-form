import * as CFWorkerJsonSchema from '@cfworker/json-schema';
import type { Schema, SchemaDraft, ValidationResult } from '@cfworker/json-schema';
import { dereference, encodePointer, validate, Validator } from '@cfworker/json-schema';
import { isObject } from '@rjsf/utils';

import type { CFWorkerFormatChecker, CustomValidatorOptionsType } from './types.ts';

/** Regular expression used to validate RJSF's `color` format. */
export const COLOR_FORMAT_REGEX =
  /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/;

/** Regular expression used to validate RJSF's `data-url` format. */
export const DATA_URL_FORMAT_REGEX = /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/;

/** The shape of the `@cfworker/json-schema` module used to reach its runtime format registry. */
interface FormatRegistryModule {
  /** The engine's runtime format registry, when the module exposes it. */
  format?: Record<string, CFWorkerFormatChecker>;
}

/** Converts a supported custom-format declaration into a format checker.
 *
 * @param spec - The custom-format function, regular expression, or regular-expression source
 * @returns - A function that checks whether a string satisfies the format
 */
function asFormatChecker(spec: string | RegExp | CFWorkerFormatChecker): CFWorkerFormatChecker {
  if (typeof spec === 'function') {
    return spec;
  }
  const regex = spec instanceof RegExp ? spec : new RegExp(spec);
  return (value: string) => regex.test(value);
}

/** Installs the built-in RJSF formats and any user-provided formats into the engine registry.
 *
 * @param customFormats - The custom formats to add after the built-in `color` and `data-url` formats
 * @param [targetRegistry] - The format registry to update; defaults to the `@cfworker/json-schema` module registry
 */
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

/** Indexes the `dependencies` schemas the engine leaves out of its `$ref` lookup. It reads a `dependencies` as one
 * subschema rather than a map of them, so an entry named like a keyword it ignores there (`type`, `required`, `enum`,
 * ...) is never indexed, nor is one named like a keyword holding a map of subschemas (`properties`, `definitions`,
 * ...), whose own keys it indexes as subschemas instead, and a `$ref` into one, such as the condition RJSF matches a
 * dependency's `oneOf` option on, would not resolve. Such an entry is indexed under every URI the lookup holds the
 * schema with the `dependencies` under, since a schema inside a resource of its own is reached both by the resource's
 * URI and by its pointer from the root, which is how RJSF names it. It is indexed into a lookup of its own, since the
 * engine rejects a URI twice and may already hold one below it under the pointer it misread, and only the URIs the
 * lookup lacks are added.
 *
 * @param lookup - The lookup to index, in place
 */
function indexDependencies(lookup: Record<string, Schema | boolean>): void {
  // In the order the engine indexed them, so a resource's own URI comes before the pointer from the root that reaches
  // it, and the `$ref`s inside an entry are resolved against the resource's base
  const pending = Object.entries(lookup);
  for (let next = pending.shift(); next !== undefined; next = pending.shift()) {
    const [uri, schema] = next;
    const dependencies = typeof schema === 'object' ? schema.dependencies : undefined;
    // The engine spells a `#` in a pointer as it stands, so only the first one starts the fragment
    const fragmentAt = uri.indexOf('#');
    const base = fragmentAt < 0 ? uri : uri.slice(0, fragmentAt);
    const pointer = fragmentAt < 0 ? '' : uri.slice(fragmentAt + 1);
    if (isObject(dependencies) && (pointer === '' || pointer.startsWith('/'))) {
      for (const [key, dependency] of Object.entries(dependencies)) {
        const at = `${pointer}/dependencies/${encodePointer(key)}`;
        if (isObject(dependency) && lookup[`${base}#${at}`] === undefined) {
          const added = Object.entries(dereference(dependency, {}, new URL(base), at)).filter(
            ([indexedUri]) => lookup[indexedUri] === undefined,
          );
          Object.assign(lookup, Object.fromEntries(added));
          pending.push(...added);
        }
      }
    }
  }
}

/** Returns each subschema the lookup holds under a pointer holding a `#`, such as one below the property `a#b`, keyed
 * by that pointer with the `#` spelled `%23`, where the lookup lacks it. The engine keys its lookup by pointers as
 * `encodeURI()` encodes them, which leaves a `#` as it is, where a `$ref` escapes it as `%23`, as RFC 6901 and the
 * pointers a form names subschemas by do, so such a `$ref` would not resolve, whether the form made it or the root
 * holds it.
 *
 * @param lookup - The lookup
 * @returns - The entries to add to it
 */
function escapedHashEntries(lookup: Record<string, Schema | boolean>): Record<string, Schema | boolean> {
  return Object.fromEntries(
    Object.entries(lookup).flatMap(([uri, schema]) => {
      const fragmentAt = uri.indexOf('#');
      const escaped = `${uri.slice(0, fragmentAt + 1)}${uri.slice(fragmentAt + 1).replaceAll('#', '%23')}`;
      return fragmentAt >= 0 && lookup[escaped] === undefined ? [[escaped, schema]] : [];
    }),
  );
}

/** A `Validator` that resolves `$ref`s through a lookup it is given, since the engine's own lookup is private and its
 * public `addSchema()` can only index a whole schema under its `$id`, not a subschema under its pointer.
 */
class LookupValidator extends Validator {
  private readonly root: Schema | boolean;

  private readonly refs: Record<string, Schema | boolean>;

  private readonly rootDraft: SchemaDraft;

  private readonly stopAtFirstError: boolean;

  /** Builds a validator that validates against `root`, resolving `$ref`s through `refs`.
   *
   * @param root - The schema to validate against
   * @param refs - The lookup, already holding `root`, that `addSchema()` indexes into and `validate()` resolves through
   * @param rootDraft - The draft to validate under
   * @param stopAtFirstError - Whether to stop after the first validation error
   */
  constructor(
    root: Schema | boolean,
    refs: Record<string, Schema | boolean>,
    rootDraft: SchemaDraft,
    stopAtFirstError: boolean,
  ) {
    super(root, rootDraft, stopAtFirstError);
    this.root = root;
    this.refs = refs;
    this.rootDraft = rootDraft;
    this.stopAtFirstError = stopAtFirstError;
  }

  override validate(instance: unknown): ValidationResult {
    return validate(instance, this.root, this.rootDraft, this.refs, this.stopAtFirstError);
  }

  override addSchema(schema: Schema, id?: string): void {
    dereference(id ? { ...schema, $id: id } : schema, this.refs);
  }
}

/** Builds a schema-bound `@cfworker/json-schema` validator.
 *
 * @param schema - The schema the validator will use
 * @param [options={}] - The options used to configure formats, schemas, draft behavior, and engine extension
 * @param [rootSchema] - The root schema to register for cross-schema `$ref` resolution
 * @returns - The configured schema-bound validator
 */
export default function createCfworkerInstance(
  schema: Schema | boolean,
  options: CustomValidatorOptionsType = {},
  rootSchema?: Schema,
): Validator {
  const { additionalMetaSchemas, customFormats, draft = '2020-12', extenderFn, shortCircuit = false } = options;

  installFormats(customFormats);
  // The engine annotates schemas during dereferencing. Clone every user-owned
  // schema so frozen RJSF fixtures and application schemas remain untouched.
  const root = structuredClone(schema);
  const lookup = dereference(root);
  let validator: Validator = new LookupValidator(root, lookup, draft, shortCircuit);

  for (const additionalSchema of additionalMetaSchemas ?? []) {
    validator.addSchema(structuredClone(additionalSchema), additionalSchema.$id);
  }
  if (rootSchema && rootSchema !== schema) {
    validator.addSchema(structuredClone(rootSchema), rootSchema.$id);
  }
  indexDependencies(lookup);
  Object.assign(lookup, escapedHashEntries(lookup));
  if (typeof extenderFn === 'function') {
    validator = extenderFn(validator);
  }
  return validator;
}
