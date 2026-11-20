import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  THEN_KEY,
} from '../constants.ts';
import isObject from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FieldFill, FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import type { FilledField } from './getDefaultFormState.ts';
import { fieldFillOf, writesPropertyDefault } from './getDefaultFormState.ts';
import { getItemSchema } from './getItemSchema.ts';
import { refDefinition } from './graph/mergePlan.ts';
import nodeOfSchema from './graph/nodeOfSchema.ts';

/** Returns the value `getDefaultFormState()` fills the field `schema` describes with when the field holds no data,
 * given `fill`, what the defaults hand it: the default its ancestors hand it, the value an ancestor's `const` gives it,
 * and whether it is required where it sits. It is the fill's own value, so it follows every rule of the fill: an
 * ancestor's `const` over the field's own `default`, `nestedDefaultsPrecedence` between two `default`s, the `anyOf`/
 * `oneOf` option the field shows when it holds no data, the defaults its own properties and items declare, a `minItems`
 * fill, and what `allOf`, `if` and `dependencies` give it under the context's settings. A property, see
 * `FieldFill.isProperty`, is filled only where `emptyObjectFields` lets the defaults write it there.
 *
 * What the fill only computes for a field no `default` reaches, such as the `false` of a required boolean, an empty
 * object or array, or a `minItems` fill with nothing to fill it with, is no default, so `undefined` is returned for it:
 * a value is the field's default only where a `default` its own subschema declares, at any depth, or a `default` or
 * `const` an ancestor hands it gives it one.
 *
 * A field `childFillOf()` handed its fill is read off its parent's fill wherever the parent's fill read the field as
 * the schema it was handed: where its subschema decides nothing from data, with no `if`, `dependencies` or
 * `anyOf`/`oneOf` it reaches through its `$ref`s and `allOf`, and the parent's fill wrote it. So one fill of the root
 * serves every field below it that decides nothing from data, and a field that does is filled by itself, with what its
 * parent's fill hands it.
 *
 * @param context - The `SchemaContext` whose `defaultFormStateBehavior` the defaults are computed under
 * @param schema - The field's schema, already retrieved
 * @param rootSchema - The root schema, which `schema` is resolved against
 * @param [fill={}] - What the defaults hand the field, see `FieldFill`
 * @returns - The value the field is filled with, or `undefined` where there is none
 */
export default function getFilledDefault<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, schema: S, rootSchema: S, fill: FieldFill = {}): unknown {
  const value = writtenValueOf(fill) ?? filledValueOf<S, F>(context, schema, rootSchema, fill);
  if (value === undefined || holdsDefault(schema, rootSchema)) {
    return value;
  }
  // A fill `childFillOf()` made reads what it inherits off its parent's fill, so the schemas above are asked first
  const inheritsOne =
    (!origins.has(fill) || ancestorsDeclare(fill)) &&
    (fill.inheritedDefault !== undefined || fill.inheritedConst !== undefined);
  return inheritsOne ? value : undefined;
}

/** Returns the default the field `schema` describes takes before the defaults fill it out: its own `default`, the one
 * its ancestors hand it and the `const` it takes, combined as `getDefaultFormState()` combines them, the option it shows
 * when it holds no data merged in, but not yet padded to `minItems` or filled in below, which is what the fill hands the
 * field's children, see `childFillOf()`
 *
 * @param context - The `SchemaContext` whose `defaultFormStateBehavior` the defaults are computed under
 * @param schema - The field's schema, already retrieved
 * @param rootSchema - The root schema, which `schema` is resolved against
 * @param [fill={}] - What the defaults hand the field, see `FieldFill`
 * @returns - The field's default, or `undefined` where it has none
 */
export function getFieldDefault<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  fill: FieldFill = {},
): unknown {
  return filledFieldOf<S, F>(context, schema, rootSchema, fill).defaults;
}

/** The value the field `schema` describes is filled with by a fill of its own, given `fill`, cut down to what the
 * defaults write for a property */
function filledValueOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  fill: FieldFill,
): unknown {
  const { value } = filledFieldOf<S, F>(context, schema, rootSchema, fill);
  return fill.isProperty &&
    !writesPropertyDefault(
      value,
      fill.isRequired ?? false,
      fill.isParentRequired,
      context.defaultFormStateBehavior?.emptyObjectFields,
    )
    ? undefined
    : value;
}

/** Whether an ancestor of the field `fill` was made for declares a `default` or a `const` that could hand it a value,
 * read off the schemas only, so no fill is made for a field no ancestor's could give one
 */
function ancestorsDeclare(fill: FieldFill): boolean {
  for (let origin = origins.get(fill); origin; origin = origins.get(origin.parentFill)) {
    if (handsValue(origin.parentSchema, origin.rootSchema)) {
      return true;
    }
  }
  return false;
}

/** The keywords whose subschemas the fill merges into the field itself, so a `default` or `const` one declares is the
 * field's to hand down
 */
const MERGED_KEYWORDS = [ALL_OF_KEY, ANY_OF_KEY, ONE_OF_KEY, THEN_KEY, ELSE_KEY];

/** Whether `schema` declares a `default` or a `const` itself, or in a subschema the fill merges into it: an
 * `anyOf`/`oneOf` option, an `allOf` member, a `then`/`else` or the one its `$ref` names
 */
function handsValue(schema: unknown, rootSchema: RJSFSchema, seen = new Set<object>()): boolean {
  if (!isObject(schema) || seen.has(schema)) {
    return false;
  }
  seen.add(schema);
  return (
    DEFAULT_KEY in schema ||
    CONST_KEY in schema ||
    MERGED_KEYWORDS.some((keyword) =>
      (Array.isArray(schema[keyword]) ? schema[keyword] : [schema[keyword]]).some((subschema: unknown) =>
        handsValue(subschema, rootSchema, seen),
      ),
    ) ||
    (REF_KEY in schema && handsValue(refTargetOf(schema, rootSchema), rootSchema, seen))
  );
}

/** Where `childFillOf()` made a fill, so the child's own value can be read off its parent's fill. Kept untyped by
 * schema, since one map holds the fills of every schema type, and read back by the call that made it
 */
interface FillOrigin {
  readonly context: SchemaContext;
  readonly rootSchema: RJSFSchema;
  /** The parent's schema, as `childFillOf()` was handed it */
  readonly parentSchema: RJSFSchema;
  readonly parentFill: FieldFill;
  readonly key: string | number;
  /** The child's subschema, as the parent's schema declares it */
  readonly childSchema: unknown;
}

/** The origin of each fill `childFillOf()` made */
const origins = new WeakMap<FieldFill, FillOrigin>();

/** Each fill's children, by the parent's schema and the child's key, so a child asked for twice is the same fill */
const children = new WeakMap<FieldFill, WeakMap<object, Map<string | number, FieldFill>>>();

/** What each field was filled with, by fill and by the schema it was filled through */
const filledFields = new WeakMap<FieldFill, WeakMap<object, FilledField>>();

/** Returns what the defaults hand the child at `key`, a property name or an item index, of the field `schema`
 * describes, given `fill`, what they hand that field. The child inherits what the field's own fill hands it there:
 * its default at `key` and the value its `const` gives there, read only once something reads them. A property is
 * required where `schema` lists it in `required`, and an item where its array is
 *
 * @param context - The `SchemaContext` the defaults are computed under
 * @param schema - The field's schema, already retrieved
 * @param rootSchema - The root schema, which `schema` is resolved against
 * @param fill - What the defaults hand the field
 * @param key - The property name or the item index of the child
 * @returns - What the defaults hand the child
 */
export function childFillOf<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  fill: FieldFill,
  key: string | number,
): FieldFill {
  let bySchema = children.get(fill);
  if (bySchema === undefined) {
    bySchema = new WeakMap();
    children.set(fill, bySchema);
  }
  let byKey = bySchema.get(schema);
  if (byKey === undefined) {
    byKey = new Map();
    bySchema.set(schema, byKey);
  }
  const known = byKey.get(key);
  if (known !== undefined) {
    return known;
  }
  const isItem = typeof key === 'number';
  const handedDown = () => filledFieldOf<S, F>(context, schema, rootSchema, fill);
  const child: FieldFill = isItem
    ? { isRequired: fill.isRequired, isItem: true }
    : { isRequired: schema.required?.includes(key), isParentRequired: fill.isRequired, isProperty: true };
  Object.defineProperties(child, {
    inheritedDefault: { enumerable: true, get: (): unknown => getByPath(handedDown().defaults, [key]) },
    inheritedConst: { enumerable: true, get: (): unknown => getByPath(handedDown().givenConst, [key]) },
  });
  origins.set(child, {
    context: context as SchemaContext,
    rootSchema,
    parentSchema: schema,
    parentFill: fill,
    key,
    childSchema: isItem ? getItemSchema<S>(schema, key) : getByPath(schema.properties, [key]),
  });
  byKey.set(key, child);
  return child;
}

/** What the field `schema` describes is filled with given `fill`, filled once per fill and schema */
function filledFieldOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  fill: FieldFill,
): FilledField {
  let bySchema = filledFields.get(fill);
  if (bySchema === undefined) {
    bySchema = new WeakMap();
    filledFields.set(fill, bySchema);
  }
  let filled = bySchema.get(schema);
  if (filled === undefined) {
    filled = fieldFillOf<S, F>(context, schema, rootSchema, fill);
    bySchema.set(schema, filled);
  }
  return filled;
}

/** The value the parent's fill wrote for the field `fill` was made for, where the parent's fill read it as the schema
 * it was handed: undefined where `fill` is no child's, the field's subschema decides anything from data, or the parent
 * wrote nothing there
 */
function writtenValueOf(fill: FieldFill): unknown {
  const origin = origins.get(fill);
  if (origin === undefined || readsData(origin.childSchema, origin.rootSchema)) {
    return undefined;
  }
  return getByPath(ownValueOf(origin.parentFill, origin), [origin.key]);
}

/** The value the field `fill` was made for is filled with, read off its parent's fill where that wrote it */
function ownValueOf(fill: FieldFill, { context, parentSchema, rootSchema }: FillOrigin): unknown {
  return writtenValueOf(fill) ?? filledFieldOf(context, parentSchema, rootSchema, fill).value;
}

/** Whether each subschema, by root schema, decides anything from data, see `readsData()` */
const readsDataOf = new WeakMap<RJSFSchema, WeakMap<object, boolean>>();

/** Whether the field `schema` describes decides anything from its data, so its schema retrieved for data may differ
 * from the one the fill reads with none: whether it, or a subschema it reaches through its `$ref`s and `allOf`, holds
 * an `if`, a `dependencies` or `anyOf`/`oneOf` options, which the fill chooses from even when an `allOf` offers them.
 * Anything that is no schema decides nothing
 */
function readsData(schema: unknown, rootSchema: RJSFSchema, seen = new Set<object>()): boolean {
  if (!isObject(schema) || seen.has(schema)) {
    return false;
  }
  let byRoot = readsDataOf.get(rootSchema);
  if (byRoot === undefined) {
    byRoot = new WeakMap();
    readsDataOf.set(rootSchema, byRoot);
  }
  const known = byRoot.get(schema);
  if (known !== undefined) {
    return known;
  }
  // Only the answer for the schema asked about is kept: one reached on the way may have been cut short by a cycle
  const isAsked = seen.size === 0;
  seen.add(schema);
  const allOf: unknown = schema[ALL_OF_KEY];
  const reads =
    IF_KEY in schema ||
    DEPENDENCIES_KEY in schema ||
    ANY_OF_KEY in schema ||
    ONE_OF_KEY in schema ||
    (Array.isArray(allOf) && allOf.some((member) => readsData(member, rootSchema, seen))) ||
    (REF_KEY in schema && readsData(refTargetOf(schema, rootSchema), rootSchema, seen));
  if (isAsked) {
    byRoot.set(schema, reads);
  }
  return reads;
}

/** Whether each subschema, by root schema, declares a `default` at any depth, see `holdsDefault()` */
const holdsDefaultOf = new WeakMap<RJSFSchema, WeakMap<object, boolean>>();

/** The keywords holding a record of subschemas, by name */
const RECORD_KEYWORDS = [PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, DEPENDENCIES_KEY];

/** The keywords holding a subschema or a list of them. A schema-valued `items` is left out: it fills the array only out
 * to `minItems`, which counts as its default only where the array declares one itself. A tuple's `prefixItems`, or an
 * `items` list, fills each position whatever `minItems` says
 */
const SCHEMA_KEYWORDS = [ADDITIONAL_PROPERTIES_KEY, ALL_OF_KEY, ANY_OF_KEY, ONE_OF_KEY, THEN_KEY, ELSE_KEY];

/** Whether `schema` declares a `default` itself or in a subschema it holds or names through a `$ref`, at any depth, so
 * a value the fill gives the field can come from one. Anything that is no schema declares none
 */
function holdsDefault(schema: unknown, rootSchema: RJSFSchema, seen = new Set<object>()): boolean {
  if (!isObject(schema) || seen.has(schema)) {
    return false;
  }
  let byRoot = holdsDefaultOf.get(rootSchema);
  if (byRoot === undefined) {
    byRoot = new WeakMap();
    holdsDefaultOf.set(rootSchema, byRoot);
  }
  const known = byRoot.get(schema);
  if (known !== undefined) {
    return known;
  }
  // Only the answer for the schema asked about is kept: one reached on the way may have been cut short by a cycle
  const isAsked = seen.size === 0;
  seen.add(schema);
  const holdsIn = (subschemas: unknown) =>
    (Array.isArray(subschemas) ? subschemas : [subschemas]).some((subschema) =>
      holdsDefault(subschema, rootSchema, seen),
    );
  const holds =
    DEFAULT_KEY in schema ||
    RECORD_KEYWORDS.some((keyword) => isObject(schema[keyword]) && holdsIn(Object.values(schema[keyword]))) ||
    SCHEMA_KEYWORDS.some((keyword) => holdsIn(schema[keyword])) ||
    holdsIn(schema[PREFIX_ITEMS_KEY]) ||
    (Array.isArray(schema[ITEMS_KEY]) && holdsIn(schema[ITEMS_KEY])) ||
    (REF_KEY in schema && holdsDefault(refTargetOf(schema, rootSchema), rootSchema, seen));
  if (isAsked) {
    byRoot.set(schema, holds);
  }
  return holds;
}

/** The subschema `schema`'s `$ref` names */
function refTargetOf(schema: RJSFSchema, rootSchema: RJSFSchema): unknown {
  const { graph, node } = nodeOfSchema(schema, rootSchema);
  return refDefinition(graph, node);
}
