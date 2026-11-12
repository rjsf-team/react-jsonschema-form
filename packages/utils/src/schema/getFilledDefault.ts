import isObject from '../isObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import mergeObjects from '../mergeObjects.ts';
import type { FormContextType, PropertyPlacement, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import { takesValueOf, writesPropertyDefault } from './getDefaultFormState.ts';

/** Returns the `default` the defaults fill the field `schema` describes with, given the one the field holding it was
 * filled with for it, as `getDefaultFormState()` reads the two. The field's own `default`, a `null` one included, wins
 * over the inherited one, unless the `context`'s `nestedDefaultsPrecedence` is `ancestorWins` and the field's type can
 * hold the inherited one. Two object defaults are merged instead, the winner's keys over the other's, except for a
 * select over object or array constants, which holds one of them whole.
 *
 * A property is filled with it only where `emptyObjectFields` lets the defaults write it there, as `placement` decides:
 * none is under `skipDefaults`, and under `populateRequiredDefaults` only a required one whose object is required or
 * is the root. Without a `placement` it is returned as computed: the root and an array item are always filled, and a
 * field hands its properties the default it computes whether or not it is written itself.
 *
 * @param context - The `SchemaContext` whose `defaultFormStateBehavior` says which of the two defaults wins, and
 *        whether a property is filled at all
 * @param schema - The field's schema, already retrieved
 * @param inheritedDefault - The default the field holding this one was filled with for it, if any
 * @param [placement] - Where the field sits as a property, left out for the root or an array item
 * @returns - The default the field is filled with, or `undefined` where there is none
 */
export default function getFilledDefault<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, schema: S, inheritedDefault: unknown, placement?: PropertyPlacement): unknown {
  const computed = computedDefault<S, F>(context, schema, inheritedDefault);
  // shortcut: an extra key counts as a property, though the fill seeds extra keys whatever `emptyObjectFields` says;
  // upgrade once a form's extra keys need their defaults judged under a setting that leaves properties unfilled
  const isWritten =
    !placement ||
    writesPropertyDefault(
      computed,
      placement.isRequired,
      placement.isParentRequired,
      context.defaultFormStateBehavior?.emptyObjectFields,
    );
  return isWritten ? computed : undefined;
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
