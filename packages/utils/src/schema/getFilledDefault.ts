import { ALL_OF_KEY, ANY_OF_KEY, DEPENDENCIES_KEY, IF_KEY, ONE_OF_KEY, REF_KEY } from '../constants.ts';
import isObject from '../isObject.ts';
import isPlainObject from '../isPlainObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FieldFill, FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import type { FilledField } from './getDefaultFormState.ts';
import { fieldFillOf, reachedDefaultAt, writesPropertyDefault } from './getDefaultFormState.ts';
import { getItemSchema } from './getItemSchema.ts';
import KeyedMemo from './graph/keyedMemo.ts';
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
 * object or array, or a `minItems` fill, is no default, so `undefined` is returned for it: a value is the field's
 * default only where the fill reports that a `default` reached it, one the field declares, one an ancestor declared
 * and hands it, the value an ancestor's `const` gives it, or one of these reaching a value below it, see
 * `FoldProps.onReachedDefault`. A `default` in an option or branch the fill didn't take reaches nothing.
 *
 * A field `childFillOf()` handed its fill is read off its parent's fill wherever the parent's fill read the field as
 * the schema it was handed: where its subschema decides nothing from data, with no `if`, `dependencies` or
 * `anyOf`/`oneOf` it reaches through its `$ref`s and `allOf`, nor does any of the parent's `patternProperties`, and
 * the parent's fill wrote it. So one fill of the root serves every field below it that decides nothing from data, and a
 * field that does is filled by itself, with what its parent's fill hands it.
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
  // A child fill made under another context or root was written by that one's fill, so it is filled anew here
  const origin = origins.get(fill);
  const written = origin?.context === context && origin.rootSchema === rootSchema ? writtenOf(fill) : UNREAD;
  if (written !== UNREAD) {
    if (written.value === undefined) {
      return undefined;
    }
    if (written.reachedDefault !== undefined) {
      return written.reachedDefault ? written.value : undefined;
    }
  }
  const { value, reachedDefault } = filledFieldOf<S, F>(context, schema, rootSchema, fill);
  const isWritten =
    !fill.isProperty ||
    writesPropertyDefault(
      value,
      fill.isRequired ?? false,
      fill.isParentRequired,
      context.defaultFormStateBehavior?.emptyObjectFields,
    );
  return reachedDefault && isWritten ? value : undefined;
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

/** Each fill's children, by context, root schema, fill, the parent's schema and the child's key, so a child asked for
 * twice is the same fill, and a fill the caller reuses under another context or root has children of its own
 */
const children = new KeyedMemo<FieldFill>();

/** What each field was filled with, by context, root schema, fill and the schema it was filled through */
const filledFields = new KeyedMemo<FilledField>();

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
  return children.get([context, rootSchema, fill, schema, key], () => {
    const handedDown = () => filledFieldOf<S, F>(context, schema, rootSchema, fill);
    const isItem = typeof key === 'number';
    const child: FieldFill = {
      ...(isItem
        ? { isRequired: fill.isRequired }
        : { isRequired: schema.required?.includes(key), isParentRequired: fill.isRequired, isProperty: true }),
      get inheritedDefault(): unknown {
        return getByPath(handedDown().defaults, [key]);
      },
      get inheritedConst(): unknown {
        return getByPath(handedDown().givenConst, [key]);
      },
    };
    origins.set(child, {
      context: context as SchemaContext,
      rootSchema,
      parentSchema: schema,
      parentFill: fill,
      key,
      childSchema: isItem ? getItemSchema<S>(schema, key) : getByPath(schema.properties, [key]),
    });
    return child;
  });
}

/** What the field `schema` describes is filled with given `fill`, filled once per context, root, fill and schema */
function filledFieldOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  fill: FieldFill,
): FilledField {
  return filledFields.get([context, rootSchema, fill, schema], () =>
    fieldFillOf<S, F>(context, schema, rootSchema, fill),
  );
}

/** What `writtenOf()` returns for a field its parent's fill can't answer for */
const UNREAD = Symbol('unread');

/** What the parent's fill wrote for a field, and whether a declared default reached it, where the fill recorded that */
interface Written {
  readonly value: unknown;
  readonly reachedDefault: boolean | undefined;
}

/** What the parent's fill wrote for each fill, see `writtenOf()` */
const writtenValues = new KeyedMemo<Written | typeof UNREAD>();

/** What the parent's fill wrote for the field `fill` was made for, where the parent's fill read it as the schema it was
 * handed, `undefined` for a declared property the parent's fill left out. `UNREAD` where `fill` is no child's, the
 * field's subschema or one of the parent's `patternProperties` decides anything from data, or the parent wrote nothing
 * the field's value could be read from, as for an item past its array's default or an extra key
 */
function writtenOf(fill: FieldFill): Written | typeof UNREAD {
  const origin = origins.get(fill);
  if (origin === undefined) {
    return UNREAD;
  }
  return writtenValues.get([fill], () => {
    const { context, parentSchema, rootSchema, parentFill, key, childSchema } = origin;
    // The parent's fill merges into a property each `patternProperties` subschema its name matches, whose `if` the
    // property's retrieved stub holds evaluated away; taking every pattern's needs no regex
    if (
      [childSchema, ...Object.values(parentSchema.patternProperties ?? {})].some((schema) =>
        readsData(schema, rootSchema),
      )
    ) {
      return UNREAD;
    }
    const parentWritten = writtenOf(parentFill);
    const parentValue =
      parentWritten === UNREAD || parentWritten.value === undefined
        ? filledFieldOf(context, parentSchema, rootSchema, parentFill).value
        : parentWritten.value;
    const value: unknown = getByPath(parentValue, [key]);
    // A property the parent's fill left out is one it wrote nothing for, unless the schema handed in reads otherwise
    // than the fill does: `retrieveSchema()` merges an `allOf`, its own or its `$ref`'s, the fill only under
    // `allOf: 'populateDefaults'`
    const isLeftOut =
      typeof key === 'string' &&
      isObject(childSchema) &&
      !(ALL_OF_KEY in childSchema) &&
      !(REF_KEY in childSchema) &&
      isPlainObject(parentValue);
    return value === undefined && !isLeftOut ? UNREAD : { value, reachedDefault: reachedDefaultAt(parentValue, key) };
  });
}

/** Whether each subschema, by root schema, decides anything from data, see `readsData()` */
const readsDataAnswers = new KeyedMemo<boolean>();

/** Whether the field `schema` describes decides anything from its data, so its schema retrieved for data may differ
 * from the one the fill reads with none: whether it, or a subschema it reaches through its `$ref`s and `allOf`, holds
 * an `if`, a `dependencies` or `anyOf`/`oneOf` options, which the fill chooses from even when an `allOf` offers them.
 * Anything that is no schema decides nothing
 */
function readsData(schema: unknown, rootSchema: RJSFSchema, seen = new Set<object>()): boolean {
  if (!isObject(schema) || seen.has(schema)) {
    return false;
  }
  const known = readsDataAnswers.peek([rootSchema, schema]);
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
    readsDataAnswers.set([rootSchema, schema], reads);
  }
  return reads;
}

/** The subschema `schema`'s `$ref` names */
function refTargetOf(schema: RJSFSchema, rootSchema: RJSFSchema): unknown {
  const { graph, node } = nodeOfSchema(schema, rootSchema);
  return refDefinition(graph, node);
}
