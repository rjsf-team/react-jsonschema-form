import {
  ALL_OF_KEY,
  ANY_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  ELSE_KEY,
  ENUM_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  REF_KEY,
  REQUIRED_KEY,
  THEN_KEY,
} from './constants.ts';
import { isSubschemaKeyword, keywordShape } from './findSchemaDefinition.ts';
import getSchemaType from './getSchemaType.ts';
import isObject from './isObject.ts';
import mergeSchemas from './mergeSchemas.ts';
import { CONTAINER_KEYWORDS, IDENTIFIER_KEYWORDS } from './schema/retrieveSchema.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** The keywords of a non-object parent that its option is rendered without. The options themselves and the
 * `discriminator` that picks between them describe the choice rather than the value. The annotations describe the
 * field the parent's own `FieldTemplate` and option selector already label, so the option's field would show them a
 * second time; `MultiSchemaField` hands them to the option's field itself where they leave the field unlabelled. The
 * `default` is applied to the parent's value, and to the option's only from the option's own, when it is selected.
 * The identifiers name the parent, and a `$id` a field registered for it, which the option would otherwise render in
 * its place. The rest are about the schema document rather than the value.
 */
const KEYWORDS_LEFT_ON_PARENT = new Set<string>([
  ANY_OF_KEY,
  ONE_OF_KEY,
  'discriminator',
  'title',
  'description',
  'deprecated',
  DEFAULT_KEY,
  ...IDENTIFIER_KEYWORDS,
  '$comment',
  ...CONTAINER_KEYWORDS,
]);

/** The bounds a value has to meet under the parent and the option alike, so the stricter of the two is what applies */
const LOWER_BOUNDS = new Set<string>(['minItems', 'minLength', 'minProperties', 'minimum', 'exclusiveMinimum']);
const UPPER_BOUNDS = new Set<string>(['maxItems', 'maxLength', 'maxProperties', 'maximum', 'exclusiveMaximum']);

/** The keywords the option's value is taken whole for when both declare one. `mergeSchemas()` would merge two `const`
 * or `default` objects key by key into a value neither declared, and two `not` subschemas into one rejecting what
 * neither rejects. A `true` constrains the value within a `not`, as `not: true` rejects every value, so it is the
 * option's there too. An `enum` is the option's list as it stands, since its `ui:enumNames` are read by position, and
 * dropping a value the parent does not list would hand every name after it to the value before; validation still
 * rejects that value
 */
const KEYWORDS_TAKEN_FROM_OPTION = new Set<string>([CONST_KEY, DEFAULT_KEY, ENUM_KEY, 'not']);

/** The keywords of a conditional, which the option's replaces as a whole once it declares any of them: one schema's
 * `if` with the other's `then` is a condition neither declared, and a bound within an `if` is one a value is tested
 * against rather than has to meet
 */
const CONDITIONAL_KEYWORDS = [IF_KEY, THEN_KEY, ELSE_KEY];

/** The keywords whose array form describes the items one position at a time, so that two of them are met position by
 * position. Every other array of subschemas, such as an `allOf`, lists schemas to combine, which positions do not
 * line up between
 */
const POSITIONAL_KEYWORDS = new Set<string>([ITEMS_KEY, 'prefixItems']);

/** Returns the schema a value has to meet to meet both `parent` and `option`, as far as the fields rendering it read it.
 * The two are merged as `mergeSchemas()` merges them, except where a keyword both declare combines into a stricter
 * value. A bound keeps the stricter of the two: an option's `maxItems: 5` beside a parent's `maxItems: 3` would
 * otherwise keep the Add button enabled for items that validation then rejects. `uniqueItems` holds when either asks
 * for it, and a `required` list asks for every name either asks for. A keyword holding subschemas is met subschema by
 * subschema, see `meetSubschema()`, within a map of named schemas such as `properties` entry by entry, since the names
 * are data, and within a tuple position by position. Which keywords hold subschemas is read from the classifier the
 * schema walks in `findSchemaDefinition()` share, so a value keyword such as a `const` object is never read as a
 * schema. Any other keyword both declare that cannot be combined into one value, such as a `format`, a `pattern`, a
 * `multipleOf` or an `enum`, is the option's.
 *
 * @param parent - What the option inherits from the parent
 * @param option - The option
 * @returns - The two met into one schema
 */
function meetSchemas(parent: GenericObjectType, option: GenericObjectType): GenericObjectType {
  const result: GenericObjectType = { ...parent, ...option };
  const takesOptionConditional = CONDITIONAL_KEYWORDS.some((key) => option[key] !== undefined);
  for (const [key, optionValue] of Object.entries(option)) {
    if (optionValue === undefined) {
      // A key holding `undefined`, as one built in code does for a limit left unset, declares nothing
      if (Object.hasOwn(parent, key)) {
        result[key] = parent[key];
      } else {
        delete result[key];
      }
    } else if (Object.hasOwn(parent, key) && !CONDITIONAL_KEYWORDS.includes(key)) {
      result[key] = meetKeyword(key, parent[key], optionValue);
    }
  }
  // A single `items` schema applies to every item, so beside a tuple it also describes the items past it, which the
  // tuple's `additionalItems` describes. A tuple declaring no `additionalItems` is one `ArrayField` offers no Add for,
  // so it gets none here either
  const parentItems = parent[ITEMS_KEY];
  const optionItems = option[ITEMS_KEY];
  if (
    Array.isArray(parentItems) &&
    parent.additionalItems !== undefined &&
    optionItems !== undefined &&
    optionItems !== true &&
    !Array.isArray(optionItems)
  ) {
    result.additionalItems = meetSubschema(parent.additionalItems, optionItems);
  } else if (isObject(parentItems) && Array.isArray(optionItems) && option.additionalItems !== undefined) {
    result.additionalItems = meetSubschema(parentItems, option.additionalItems);
  }
  if (takesOptionConditional) {
    for (const key of CONDITIONAL_KEYWORDS) {
      if (option[key] === undefined) {
        delete result[key];
      }
    }
  }
  return result;
}

/** Returns the value of `key` that meets both `parentValue` and `optionValue`, see `meetSchemas()`.
 *
 * @param key - The keyword both declare
 * @param parentValue - The parent's value for it
 * @param optionValue - The option's value for it
 * @returns - The value the met schema has for `key`
 */
function meetKeyword(key: string, parentValue: unknown, optionValue: unknown): unknown {
  if (typeof parentValue === 'number' && typeof optionValue === 'number') {
    if (LOWER_BOUNDS.has(key)) {
      return Math.max(parentValue, optionValue);
    }
    return UPPER_BOUNDS.has(key) ? Math.min(parentValue, optionValue) : optionValue;
  }
  if (key === 'uniqueItems') {
    return parentValue === true || optionValue;
  }
  if (key === REQUIRED_KEY && Array.isArray(parentValue) && Array.isArray(optionValue)) {
    return [...new Set([...parentValue, ...optionValue])];
  }
  if (KEYWORDS_TAKEN_FROM_OPTION.has(key)) {
    return optionValue;
  }
  if (!isSubschemaKeyword(key)) {
    // A value keyword such as `examples`, or one JSON Schema does not define, merges as `mergeSchemas()` merges it
    return isObject(parentValue) && isObject(optionValue) ? mergeSchemas(parentValue, optionValue) : optionValue;
  }
  if (isObject(parentValue) && isObject(optionValue) && keywordShape(key, parentValue) === 'map') {
    const entries: GenericObjectType = { ...parentValue, ...optionValue };
    for (const [name, optionEntry] of Object.entries(optionValue)) {
      // An own entry only: a property named `constructor` would otherwise be met with `Object`'s
      if (Object.hasOwn(parentValue, name)) {
        entries[name] = meetSubschema(parentValue[name], optionEntry);
      }
    }
    return entries;
  }
  if (POSITIONAL_KEYWORDS.has(key) && parentValue !== false && optionValue !== true) {
    if (Array.isArray(parentValue) && Array.isArray(optionValue)) {
      return meetTuples(parentValue, optionValue);
    }
    if (Array.isArray(parentValue)) {
      return parentValue.map((position) => meetSubschema(position, optionValue));
    }
    if (Array.isArray(optionValue)) {
      return optionValue.map((position) => meetSubschema(parentValue, position));
    }
  }
  return meetSubschema(parentValue, optionValue);
}

/** Meets two tuples position by position. A position only one of them describes is that one's, without what the
 * other declares for the items past its tuple.
 *
 * @param parent - The parent's subschemas, one per position
 * @param option - The option's subschemas, one per position
 * @returns - The subschemas the two meet in, one per position either describes
 */
function meetTuples(parent: unknown[], option: unknown[]): unknown[] {
  return Array.from({ length: Math.max(parent.length, option.length) }, (_, index) => {
    if (index >= option.length) {
      return parent[index];
    }
    return index < parent.length ? meetSubschema(parent[index], option[index]) : option[index];
  });
}

/** Returns the subschema that meets both `parent` and `option`. A parent's `false`, which nothing meets, stays in place
 * of the option's subschema, and an option's `true`, which adds nothing to meet, leaves the parent's in place: an
 * option's `items: true` would otherwise drop the parent's `items` and render each item as an unsupported field. So
 * does an option's `undefined`, such as a property entry built in code, which declares nothing, as a key holding it
 * does in `meetSchemas()`, and a parent's `undefined` leaves the option's in place. Two schemas are met by
 * `meetSchemas()`, unless either holds a `$ref`, and any other pair is the option's.
 *
 * A `$ref` is resolved only where the subschema is rendered, which is where the root schema it points into is known,
 * and the keywords beside it are then layered over the ones it names, so a looser bound met in beside it would win.
 * Such a pair is left to the field's own `allOf` merge, which meets them once the `$ref` is resolved.
 *
 * @param parent - The parent's subschema
 * @param option - The option's subschema
 * @returns - The subschema the two meet in
 */
function meetSubschema(parent: unknown, option: unknown): unknown {
  if (parent === undefined) {
    return option;
  }
  if (parent === false || option === true || option === undefined) {
    return parent;
  }
  if (!isObject(parent) || !isObject(option)) {
    return option;
  }
  return Object.hasOwn(parent, REF_KEY) || Object.hasOwn(option, REF_KEY)
    ? { [ALL_OF_KEY]: [parent, option] }
    : meetSchemas(parent, option);
}

/** Whether the field of `schema` renders a field of its own beside its selected `anyOf`/`oneOf` option, as an object's
 * `ObjectField` does (see `getFieldComponent()` in `SchemaField`). Such a field shows its own properties and other
 * keywords, so its option is read merged with the whole field; every other field leaves the whole field to the option
 * as `getRenderedOptionSchema()` renders it. Everything that picks between the two reads this, so that none of them
 * renders one option and seeds or walks another.
 *
 * @param schema - The schema holding the options
 * @returns - True when the field renders a field of its own beside the option
 */
export function rendersOwnFieldBesideOption<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  return getSchemaType<S>(schema) === 'object';
}

/** Returns the schema an `anyOf`/`oneOf` option of `parent` is rendered with, the one place that decides what an option
 * inherits from the schema holding it, so that `MultiSchemaField`, the `getUiRequiredErrorSchema()` walk and the
 * defaults `getDefaultFormState()` computes for a field that is not an object read the same option.
 *
 * An object parent renders its own `ObjectField` beside the option (see `getFieldComponent()` in `SchemaField`), which
 * shows the parent's properties and other keywords, so the option takes only its `required` list and its type. Every
 * other parent renders nothing of its own and leaves the whole field to the option, so the option takes each of the
 * parent's keywords that describes the value, such as an array's `items` and `uniqueItems` or a string's `format`.
 * The two are met with `meetSchemas()`, so an option's `items` adds to the parent's rather than replacing them. A
 * bound both declare, such as a `maxItems` or a `minimum`, keeps the stricter of the two, since a value has to meet
 * both, and an option's `true` subschema leaves the parent's in place; any other keyword both declare that cannot be
 * combined into one value is the option's.
 *
 * An option naming no `type` takes the parent's, and an object parent that names none is read as an object, the type
 * its `ObjectField` was picked for. A parent allowing several types passes all of them on, since the option is one
 * branch of the choice made there rather than a narrowing of what the parent accepts: a field reading `schema.type`,
 * such as `getInputProps()`, which withholds the numeric `pattern` from a union precisely because the other types do
 * not have to match it, would otherwise be told the value is of a type the parent never pinned it to.
 *
 * @param parent - The schema holding the `anyOf`/`oneOf`, with its `$ref`s and `allOf` resolved
 * @param option - The option, with its own `$ref` resolved
 * @returns - The option as it is rendered, or `option` itself when the parent has nothing to pass on
 */
export default function getRenderedOptionSchema<S extends StrictRJSFSchema = RJSFSchema>(parent: S, option: S): S {
  const rendersOwnField = rendersOwnFieldBesideOption<S>(parent);
  const inherited: GenericObjectType = {};
  if (rendersOwnField) {
    if (parent.required) {
      inherited[REQUIRED_KEY] = parent.required;
    }
    if (!('type' in option)) {
      inherited.type = parent.type ?? 'object';
    }
  } else {
    // `Object.entries()` skips Symbol keys, so a marker such as `ADDITIONAL_PROPERTY_FLAG` stays on the parent, whose
    // field renders the key editor it asks for
    for (const [key, value] of Object.entries(parent)) {
      if (!KEYWORDS_LEFT_ON_PARENT.has(key)) {
        inherited[key] = value;
      }
    }
  }
  if (Object.keys(inherited).length === 0) {
    return option;
  }
  // An object parent passes on no bound, so there is none to tighten
  return (rendersOwnField ? mergeSchemas(inherited, option) : meetSchemas(inherited, option)) as S;
}
