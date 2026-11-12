import { absentKeywordAllows } from '../additionalPropertiesUtils.ts';
import { ADDITIONAL_PROPERTY_FLAG } from '../constants.ts';
import getSchemaType from '../getSchemaType.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isObject from '../isObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import mergeObjects from '../mergeObjects.ts';
import type {
  FormContextType,
  GenericObjectType,
  PropertyPlacement,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
} from '../types.ts';
import { takesValueOf, writesPropertyDefault } from './getDefaultFormState.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Returns the `default` the defaults fill the field `schema` describes with, given the one the field holding it was
 * filled with for it, as `getDefaultFormState()` reads the two. The field's own `default`, a `null` one included, wins
 * over the inherited one, unless the `context`'s `nestedDefaultsPrecedence` is `ancestorWins` and the field's type can
 * hold the inherited one. Two object defaults are merged instead, the winner's keys over the other's, except for a
 * select over object or array constants, which holds one of them whole.
 *
 * A property is filled with it only where `emptyObjectFields` lets the defaults write it there, as `placement` decides:
 * none is under `skipDefaults`, and under `populateRequiredDefaults` only one whose object is required, or that is
 * required itself where its object is the root, and a value other than an object only where it is required as well.
 * An object field's object default is first cut down key by key, as the fill builds it: each key its `properties`
 * declare keeps only what the defaults write into that property, read as the fill reads it, its `$ref`s and `allOf`
 * resolved and its conditions and `dependencies` applied as for a property holding no data, and any other key only
 * where `additionalProperties` seeds it, so an empty object is left where they write none of its keys. Without a
 * `placement` it is returned as computed: the root and an array item are always filled, and a field hands its
 * properties the default it computes whether or not it is written itself.
 *
 * @param context - The `SchemaContext` whose `defaultFormStateBehavior` says which of the two defaults wins, and
 *        whether a property is filled at all
 * @param schema - The field's schema, already retrieved
 * @param rootSchema - The root schema, which the properties an object default is cut down by are resolved against
 * @param inheritedDefault - The default the field holding this one was filled with for it, if any
 * @param [placement] - Where the field sits as a property, left out for the root or an array item
 * @returns - The default the field is filled with, or `undefined` where there is none
 */
export default function getFilledDefault<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  inheritedDefault: unknown,
  placement?: PropertyPlacement,
): unknown {
  const computed = computedDefault<S, F>(context, schema, inheritedDefault);
  return placement ? writtenDefault<S, F>(context, rootSchema, schema, computed, placement) : computed;
}

/** The part of `computed` the defaults write into the property `schema` describes at `placement`, or `undefined` where
 * they write none of it
 */
function writtenDefault<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  computed: unknown,
  placement: PropertyPlacement,
): unknown {
  const written =
    isObject(computed) && getSchemaType<S>(schema) === 'object' && !isWholeValueSelect<S>(schema)
      ? writtenKeys<S, F>(context, rootSchema, schema, computed, placement.isRequired)
      : computed;
  // shortcut: an extra key counts as a property, though the fill seeds extra keys whatever `emptyObjectFields` says;
  // upgrade once a form's extra keys need their defaults judged under a setting that leaves properties unfilled
  return writesPropertyDefault(
    written,
    placement.isRequired ?? false,
    placement.isParentRequired,
    context.defaultFormStateBehavior?.emptyObjectFields,
  )
    ? written
    : undefined;
}

/** The keys of an object field's default the defaults write, each declared property's cut down as its own placement
 * decides
 */
function writtenKeys<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  computed: GenericObjectType,
  isRequired: boolean | undefined,
): GenericObjectType {
  const properties = schema.properties ?? {};
  const seedsExtraKeys = absentKeywordAllows<S, F>(context, schema) || Boolean(schema.additionalProperties);
  const written: GenericObjectType = {};
  for (const [key, value] of Object.entries(computed)) {
    // An extra key `retrieveSchema()` stubbed among the properties is seeded below, as the fill seeds one
    if (Object.hasOwn(properties, key) && !hasSchemaMarker(properties[key], ADDITIONAL_PROPERTY_FLAG)) {
      const property = (isObject(properties[key]) ? properties[key] : {}) as S;
      // Only an object default is cut down by its schema, so only then is it resolved. The fill applies its conditions
      // as for no data, not against its default
      const propertySchema = isObject(value)
        ? retrieveSchema<unknown, S, F>(context, property, rootSchema, undefined)
        : property;
      const propertyValue = writtenDefault<S, F>(context, rootSchema, propertySchema, value, {
        isRequired: schema.required?.includes(key),
        isParentRequired: isRequired,
      });
      if (propertyValue !== undefined) {
        written[key] = propertyValue;
      }
    } else if (seedsExtraKeys && writesPropertyDefault(value, false, isRequired)) {
      // The fill seeds an extra key whatever `emptyObjectFields` says. shortcut: its object default is judged whole
      // rather than key by key against `additionalProperties`; upgrade once an extra key's nested defaults need judging
      written[key] = value;
    }
  }
  return written;
}

/** The default the defaults compute for the field `schema` describes, from its own and the inherited one */
function computedDefault<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  inheritedDefault: unknown,
): unknown {
  const ownDefault: unknown = schema.default;
  if (inheritedDefault === undefined) {
    return ownDefault;
  }
  if (ownDefault === undefined) {
    return inheritedDefault;
  }
  const ancestorWins =
    context.defaultFormStateBehavior?.nestedDefaultsPrecedence === 'ancestorWins' &&
    takesValueOf<S>(schema, inheritedDefault);
  if (isObject(ownDefault) && isObject(inheritedDefault) && !isWholeValueSelect<S>(schema)) {
    return ancestorWins ? mergeObjects(ownDefault, inheritedDefault) : mergeObjects(inheritedDefault, ownDefault);
  }
  return ancestorWins ? inheritedDefault : ownDefault;
}
