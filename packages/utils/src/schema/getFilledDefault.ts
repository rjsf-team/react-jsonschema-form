import { absentKeywordAllows } from '../additionalPropertiesUtils.ts';
import { ADDITIONAL_PROPERTY_FLAG } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getSchemaType from '../getSchemaType.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import type { XxxOfOptions } from '../getXxxOfOptions.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isConstantSelect from '../isConstantSelect.ts';
import isObject from '../isObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import mergeObjects from '../mergeObjects.ts';
import mergeSchemas from '../mergeSchemas.ts';
import type {
  FormContextType,
  GenericObjectType,
  PropertyPlacement,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
} from '../types.ts';
import { closestOption } from './getClosestMatchingOption.ts';
import { takesValueOf, writesPropertyDefault } from './getDefaultFormState.ts';
import { withoutKeys } from './graph/mergePlan.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Returns the `default` the defaults fill the field `schema` describes with, given the one the field holding it was
 * filled with for it, as `getDefaultFormState()` reads the two. The field's own `default`, a `null` one included, wins
 * over the inherited one, unless the `context`'s `nestedDefaultsPrecedence` is `ancestorWins` and the field's type can
 * hold the inherited one. Two object defaults are merged instead, the winner's keys over the other's, except for a
 * select over object or array constants, which holds one of them whole. A field offering `anyOf`/`oneOf` options is
 * filled through the one its own `default` matches, as a field holding no data is, that option's `default` merged over
 * the field's own, and so on through the options that option offers.
 *
 * A property is filled with it only where `emptyObjectFields` lets the defaults write it there, as `placement` decides:
 * none is under `skipDefaults`, and under `populateRequiredDefaults` only one whose object is required, or that is
 * required itself where its object is the root, and a value other than an object only where it is required as well.
 * An object field's object default is first cut down key by key, as the fill builds it, with the `anyOf`/`oneOf` option
 * its own `default` matches merged into the field as the fill merges one into a field holding no data: each key its
 * `properties` declare keeps only what the defaults write into that property, read as the fill reads it, its `$ref`s
 * and `allOf` resolved and its conditions and `dependencies` applied as for a property holding no data, and any other key only
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
  // The fill merges the option it picks into the field, its `default` over the field's own, so only the inherited one
  // is an ancestor's, even under `ancestorWins`
  const field = withFilledOptions<S, F>(context, rootSchema, schema, inheritedDefault);
  const computed = computedDefault<S, F>(context, field, inheritedDefault);
  return placement ? writtenDefault<S, F>(context, rootSchema, field, computed, placement) : computed;
}

/** `schema` with the `anyOf`/`oneOf` options the fill renders for a field holding no data merged in, as it folds into
 * the option it picks and picks again among that option's own. A select over constants is left as it is, sparing every
 * enum-like select a validation pass. shortcut: the fill still folds into a primitive select's option, so a `default`
 * one of its constant options declares is missed; upgrade once constant options need their own defaults read
 */
function withFilledOptions<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  inheritedDefault: unknown,
  chosen: S[][] = [],
): S {
  const xxxOf = getXxxOfOptions<S>(schema);
  // A list chosen from already is reached again only through an option leading back to it, which ends the choice, as
  // it does in the fill. Compared by value, since each option is resolved into a copy
  if (!xxxOf || isConstantSelect<S>(schema) || chosen.some((options) => deepEquals(options, xxxOf.options))) {
    return schema;
  }
  chosen.push(xxxOf.options);
  const field = withFilledOption<S, F>(context, rootSchema, schema, xxxOf, inheritedDefault);
  return field ? withFilledOptions<S, F>(context, rootSchema, field, inheritedDefault, chosen) : schema;
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
    isObject(computed) && !isWholeValueSelect<S>(schema) && getSchemaType<S>(schema) === 'object'
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

/** `schema` with the one of its `xxxOf` options the fill renders for a field holding no data merged in, as it merges one
 * into an object field: the one its own `default` matches. Undefined where that option is no schema
 */
function withFilledOption<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  { key, options }: XxxOfOptions<S>,
  inheritedDefault: unknown,
): S | undefined {
  // The fill matches a field holding no data by its own `default`, not the inherited one merged in. shortcut: under
  // `ancestorWins` the merged default stands in for the inherited one it matches; upgrade once the two pick apart
  const toMatch =
    context.defaultFormStateBehavior?.nestedDefaultsPrecedence === 'ancestorWins'
      ? computedDefault<S, F>(context, schema, inheritedDefault)
      : schema.default;
  const option: unknown =
    options[
      closestOption<S, F>(context, rootSchema, toMatch, options, 0, false, getDiscriminatorFieldFromSchema<S>(schema))
    ];
  return isObject(option)
    ? (mergeSchemas(withoutKeys(schema, key), retrieveSchema<unknown, S, F>(context, option as S, rootSchema)) as S)
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
      // Only an object default is cut down by its schema, so only then is it resolved, with the options the fill
      // renders for it merged in. The fill applies its conditions as for no data, not against its default
      const propertySchema = isObject(value)
        ? withFilledOptions<S, F>(
            context,
            rootSchema,
            retrieveSchema<unknown, S, F>(context, property, rootSchema, undefined),
            value,
          )
        : property;
      // The fill writes the property's own `default` over the one its object hands it, as `computedDefault()` reads it
      const propertyDefault = computedDefault<S, F>(context, propertySchema, value);
      const propertyValue = writtenDefault<S, F>(context, rootSchema, propertySchema, propertyDefault, {
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
