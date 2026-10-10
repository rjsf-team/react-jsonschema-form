import { ANY_OF_KEY, CONST_KEY, DEFAULT_KEY, IF_KEY, ONE_OF_KEY, REQUIRED_KEY } from './constants.ts';
import { keywordShape } from './findSchemaDefinition.ts';
import getSchemaType from './getSchemaType.ts';
import isObject from './isObject.ts';
import mergeSchemas from './mergeSchemas.ts';
import { CONTAINER_KEYWORDS, IDENTIFIER_KEYWORDS } from './schema/retrieveSchema.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** The keywords of a non-object parent that its option is rendered without. The options themselves and the
 * `discriminator` that picks between them describe the choice rather than the value. The annotations describe the
 * field the parent's own `FieldTemplate` and option selector already label, so the option's field would show them a
 * second time. The `default` is applied to the parent's value, and to the option's only from the option's own, when it
 * is selected. The identifiers name the parent, and a `$id` a field registered for it, which the option would otherwise
 * render in its place. The rest are about the schema document rather than the value.
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

/** The subschemas a value is tested against rather than has to meet, where keeping the stricter bound would be wrong,
 * and where a `true` constrains the value: `not: true` rejects every value. A bound both declare there, or a `true` the
 * option gives one, is left as the option's, which no field renders from.
 */
const UNTIGHTENED_SUBSCHEMA_KEYWORDS = new Set<string>(['not', IF_KEY]);

/** The keywords holding a value rather than a schema, which `mergeSchemas()` would otherwise merge key by key into an
 * object neither schema declared when both give an object
 */
const VALUE_KEYWORDS = new Set<string>([CONST_KEY, DEFAULT_KEY]);

/** Replaces each bound in `merged` that both `parent` and `option` declare with the stricter of the two, at every level
 * `mergeSchemas()` merged the two, such as within `items`. Which keywords hold subschemas to descend into is decided by
 * `keywordShape()`, the classifier the schema walks in `findSchemaDefinition()` share, so a value keyword such as a
 * `const` object is never read as a schema. JSON Schema applies the parent and the option alike, so a
 * value has to meet both: an option's `maxItems: 5` beside a parent's `maxItems: 3` would otherwise keep the Add button
 * enabled for items that validation then rejects. `uniqueItems` holds when either asks for it, and a `true` subschema,
 * which adds nothing to meet, leaves the parent's in place rather than replacing it: an option's `items: true` would
 * otherwise drop the parent's `items` and render each item as an unsupported field, while a parent's `false`, which
 * nothing meets, stays in place of the option's subschema. Keywords that cannot be combined into one value, such as a
 * `format`, a `pattern`, a `multipleOf` or a `const` or `default` object, are left as the option's.
 *
 * @param merged - The parent merged with the option
 * @param parent - What the option inherits from the parent
 * @param option - The option
 * @returns - A copy of `merged` with the stricter of each bound both declare
 */
function keepStricterBounds(
  merged: GenericObjectType,
  parent: GenericObjectType,
  option: GenericObjectType,
): GenericObjectType {
  const result = { ...merged };
  for (const [key, optionValue] of Object.entries(option)) {
    const parentValue = parent[key];
    if (typeof parentValue === 'number' && typeof optionValue === 'number') {
      if (LOWER_BOUNDS.has(key)) {
        result[key] = Math.max(parentValue, optionValue);
      } else if (UPPER_BOUNDS.has(key)) {
        result[key] = Math.min(parentValue, optionValue);
      }
    } else if (key === 'uniqueItems' && parentValue === true) {
      result[key] = true;
    } else if (VALUE_KEYWORDS.has(key)) {
      result[key] = optionValue;
    } else if (
      parentValue === false &&
      !UNTIGHTENED_SUBSCHEMA_KEYWORDS.has(key) &&
      keywordShape(key, {}) === 'single'
    ) {
      result[key] = false;
    } else if (isObject(parentValue) && !UNTIGHTENED_SUBSCHEMA_KEYWORDS.has(key)) {
      const shape = keywordShape(key, parentValue);
      if (shape === 'single' && optionValue === true) {
        result[key] = parentValue;
      } else if (shape === 'single' && isObject(optionValue)) {
        result[key] = keepStricterBounds(merged[key] as GenericObjectType, parentValue, optionValue);
      } else if (shape === 'map' && isObject(optionValue)) {
        result[key] = keepStricterBoundsPerEntry(merged[key] as GenericObjectType, parentValue, optionValue);
      }
    }
  }
  return result;
}

/** Applies `keepStricterBounds()` to each entry of a keyword mapping names to schemas, such as `properties`, whose
 * names are data: a property named `uniqueItems` or `maxLength` holds a schema, not that keyword's value. An option's
 * `true` entry leaves the parent's in place, and a parent's `false` entry stays, as they do for a single subschema.
 *
 * @param merged - The parent's map merged with the option's
 * @param parent - The parent's map
 * @param option - The option's map
 * @returns - A copy of `merged` with the stricter of each bound both declare within each entry
 */
function keepStricterBoundsPerEntry(
  merged: GenericObjectType,
  parent: GenericObjectType,
  option: GenericObjectType,
): GenericObjectType {
  const result = { ...merged };
  for (const [name, optionEntry] of Object.entries(option)) {
    const parentEntry = parent[name];
    if (parentEntry === false) {
      result[name] = false;
    } else if (isObject(parentEntry) && optionEntry === true) {
      result[name] = parentEntry;
    } else if (isObject(parentEntry) && isObject(optionEntry)) {
      result[name] = keepStricterBounds(merged[name] as GenericObjectType, parentEntry, optionEntry);
    }
  }
  return result;
}

/** Returns the schema an `anyOf`/`oneOf` option of `parent` is rendered with, the one place that decides what an option
 * inherits from the schema holding it, so that `MultiSchemaField` and the `getUiRequiredErrorSchema()` walk read the
 * same option.
 *
 * An object parent renders its own `ObjectField` beside the option (see `getFieldComponent()` in `SchemaField`), which
 * shows the parent's properties and other keywords, so the option takes only its `required` list and its type. Every
 * other parent renders nothing of its own and leaves the whole field to the option, so the option takes each of the
 * parent's keywords that describes the value, such as an array's `items` and `uniqueItems` or a string's `format`.
 * The two are merged with `mergeSchemas()`, so an option's `items` adds to the parent's rather than replacing them. A
 * bound both declare, such as a `maxItems` or a `minimum`, keeps the stricter of the two, since a value has to meet
 * both, and an option's `true` subschema leaves the parent's in place; any other keyword both declare is the option's.
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
  const parentType = getSchemaType<S>(parent);
  const inherited: GenericObjectType = {};
  if (parentType === 'object') {
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
  const merged = mergeSchemas(inherited, option);
  // An object parent passes on no bound, so there is none to tighten
  return (parentType === 'object' ? merged : keepStricterBounds(merged, inherited, option)) as S;
}
