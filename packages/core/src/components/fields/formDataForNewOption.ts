import type {
  FormContextType,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
  UiSchemaDefinitions,
} from '@rjsf/utils';
import { deepEquals, getPropertySchema, getRenderedOptionSchema, isPlainObject, mergeSchemas } from '@rjsf/utils';

import { declaresOwnValue, declaresValueFor } from '../declaresValue.ts';

/** Returns `option` carrying the `required` that `parentSchema` declares, which is what decides whether the form
 * populates a key at all under a `defaultFormStateBehavior` keyed off `required`. A schema's defaults
 * have to be computed from this rather than from the option alone, or the same data behaves differently depending
 * on whether `required` was written on the option or on the schema holding the `oneOf`/`anyOf`.
 *
 * The parent's other keywords are deliberately left out, so this is narrower than the schema `MultiSchemaField`
 * renders with `getRenderedOptionSchema()`. That schema also carries the parent's `type`, and for a parent that is not
 * an object every other keyword describing the value, so an option omitting them still picks the right widget, but a
 * type the option never stated tells `getDefaultFormState()` to build a value the option does not describe — a
 * cleared array comes back as `[null, null]` rather than staying cleared. The data is sanitized against the rendered
 * schema instead, see `renderedOption()`.
 *
 * @param [parentSchema] - The schema holding the `oneOf`/`anyOf`
 * @param [option] - The option to merge the parent's `required` into
 * @returns - The option with the parent's `required`, or undefined when there is no option
 */
function withParentRequired<S extends StrictRJSFSchema = RJSFSchema>(parentSchema?: S, option?: S): S | undefined {
  if (!option || !parentSchema?.required) {
    return option;
  }
  return mergeSchemas({ required: parentSchema.required }, option) as S;
}

/** Returns `option` as `MultiSchemaField` renders it, which is what the data being carried across a switch was entered
 * against. Sanitizing against the bare option instead would discard every value the option only holds through what it
 * inherits: an array whose options only limit its length would lose its items, since neither bare option is an array.
 *
 * @param [parentSchema] - The schema holding the `oneOf`/`anyOf`
 * @param [option] - The option to render
 * @returns - The option as it is rendered, or `option` as it is when there is no parent or no option
 */
function renderedOption<S extends StrictRJSFSchema = RJSFSchema>(parentSchema?: S, option?: S): S | undefined {
  return option && parentSchema ? getRenderedOptionSchema<S>(parentSchema, option) : option;
}

/** Determines whether `option` declares a value of its own for `key`, resolving the property's schema first.
 * `stalePathsForNewSchema()` applies the same rule to a conditional branch, through the same predicate.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to resolve the property schema with
 * @param option - The option whose declaration is being tested
 * @param key - The name of the property to test
 * @returns - True when the option declares a `default` or `const` for `key`
 */
function optionDeclaresValueFor<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schemaUtils: SchemaUtilsType<T, S, F>, option: S, key: string): boolean {
  return declaresValueFor<S>(option, key, schemaUtils.retrieveSchema(getPropertySchema<S>(option, key)));
}

/** The uiSchemas the defaults of the two options are computed with, named so the old and new cannot be swapped */
interface OptionUiSchemas<T, S extends StrictRJSFSchema, F extends FormContextType> {
  newOptionUiSchema?: UiSchema<T, S, F>;
  oldOptionUiSchema?: UiSchema<T, S, F>;
  uiSchemaDefinitions?: UiSchemaDefinitions<S, F>;
}

/** Computes the form data to carry across a switch from `oldOption` to `newOption` of a `oneOf`/`anyOf`.
 *
 * `sanitizeDataForNewSchema()` drops what the new option cannot hold, and `getDefaultFormState()` fills in what it
 * declares, but neither lets the new option's `default` reach a key that already holds something, so a value the old
 * option's `default` put there outlasts the switch and switching back does not restore it
 * ([#4476](https://github.com/rjsf-team/react-jsonschema-form/issues/4476)). The same is true of a key whose value
 * sanitize discarded, because it clears by assigning `undefined` rather than by removing the key, and
 * `getDefaultFormState()` populates an absent key but leaves one explicitly set to `undefined` alone. Deleting either
 * kind of key outright is what lets the fill below reach it.
 *
 * A key qualifies only when all of the following hold, which between them keep the deletion from stranding data the
 * user or the caller supplied:
 *
 * - It carried a value over. A key that arrived empty has nothing stale in it, and emptying it further would rob
 *   `Form` of the all-`undefined` payload it reads as a switch away from a `null` option, which is the only way a
 *   default declared above the option is restored.
 * - The new option declares a value for it, as a property `default`/`const` or through the option's own `default`
 *   object. The computed defaults say more than an option declares, so honoring them alone would delete a nested
 *   object's leaf defaults, a required array's `[]` or a required boolean's `false` — none of which the option
 *   asked for.
 * - The new option's computed defaults also hold something for it, so the fill is certain to put a value back.
 *   What an option declares and what `computeDefaults()` acts on are not the same set: a `default` reached through
 *   `allOf` or `if`/`then` resolves here but is not filled, and a `const` is skipped entirely under
 *   `constAsDefaults: 'never'`. Deleting on the declaration alone would empty those keys for good.
 * - Sanitize discarded the value, or the old option declares one and the key still holds it. Only the second of
 *   those compares anything, so only it needs the old option's declaration: a value sanitize threw away is gone
 *   no matter who declared it, and leaving the key holding `undefined` only blocks the fill.
 *
 * Staleness is judged against `formData` as it arrived, not against the sanitized copy: sanitize rewrites a nested
 * value whenever the two options declare different properties for it, adding an `undefined` key for one the new
 * option drops and a leaf default for one it adds, and the rewritten value no longer resembles the default it came
 * from. Both sets of defaults use `excludeObjectChildren`, the flag the fill below uses, so all three describe the
 * same thing; computing them any other way makes them disagree under a `defaultFormStateBehavior`
 * that suppresses object defaults. They describe what an earlier switch through here wrote rather than every default
 * the form holds — `Form` fills the root with `includeUndefinedValues: false`. That divergence only stops a key from
 * qualifying, so the worst it costs is that the replacement does not happen.
 *
 * Values are matched whole, per top-level key of the option: editing one leaf of a nested object leaves the whole
 * subtree in place, so its other leaves keep the old option's defaults.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to compute the defaults and sanitize the data with
 * @param formData - The form data associated with `oldOption`
 * @param [newOption] - The option being switched to, or undefined when the selection is being cleared
 * @param [oldOption] - The option being switched away from, if one was selected
 * @param [parentSchema] - The schema holding the `oneOf`/`anyOf`, whose `required` is merged into each option
 *        before its defaults are computed, and which each option inherits from as it is rendered before the data is
 *        sanitized against it
 * @param [uiSchemas] - Each option's own uiSchema, so its `ui:initialValue`/`ui:emptyValue` apply to the defaults
 *        computed for it, and the registry's `ui:definitions`, which an option's uiSchema never carries itself
 * @returns - The form data for `newOption`, or undefined when it holds nothing, as when the selection is cleared
 */
export default function formDataForNewOption<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  formData: T | undefined,
  newOption?: S,
  oldOption?: S,
  parentSchema?: S,
  uiSchemas: OptionUiSchemas<T, S, F> = {},
): T | undefined {
  const { newOptionUiSchema, oldOptionUiSchema, uiSchemaDefinitions } = uiSchemas;
  let newFormData: T | undefined = schemaUtils.sanitizeDataForNewSchema(
    renderedOption<S>(parentSchema, newOption),
    renderedOption<S>(parentSchema, oldOption),
    formData,
  );
  const newOptionForDefaults = withParentRequired<S>(parentSchema, newOption);
  if (newOptionForDefaults) {
    const oldOptionForDefaults = withParentRequired<S>(parentSchema, oldOption);
    let oldDefaults: unknown;
    let oldDefaultsComputed = false;
    /** Computes the old option's defaults at most once, and only for a key that has got far enough to need them. */
    const defaultsForOldOption = () => {
      if (!oldDefaultsComputed) {
        oldDefaults = oldOptionForDefaults
          ? schemaUtils.getDefaultFormState(
              oldOptionForDefaults,
              undefined,
              'excludeObjectChildren',
              undefined,
              oldOptionUiSchema,
              uiSchemaDefinitions,
            )
          : undefined;
        oldDefaultsComputed = true;
      }
      return oldDefaults;
    };
    let newDefaults: T | undefined;
    let newDefaultsComputed = false;
    /** Computes the new option's defaults on their own at most once. Both the test of what the fill can restore and
     * the fill itself need them whenever nothing is carried over, and they are the same computation. */
    const defaultsForNewOption = () => {
      if (!newDefaultsComputed) {
        newDefaults = schemaUtils.getDefaultFormState(
          newOptionForDefaults,
          undefined,
          'excludeObjectChildren',
          undefined,
          newOptionUiSchema,
          uiSchemaDefinitions,
        ) as T;
        newDefaultsComputed = true;
      }
      return newDefaults;
    };
    if (isPlainObject(newFormData)) {
      const sanitizedData = newFormData;
      const oldData: Record<string, unknown> = isPlainObject(formData) ? formData : {};
      // Each test below costs more than the one before it, so they run in that order: only a key that carried a
      // value over can be holding something stale, and that much is free to check
      const carriedKeys = Object.keys(sanitizedData).filter((key) => oldData[key] !== undefined);
      if (carriedKeys.length > 0) {
        const optionDefaults = defaultsForNewOption();
        const newDefaultsData: Record<string, unknown> = isPlainObject(optionDefaults) ? optionDefaults : {};
        // `retrieveSchema()` sends a key holding a nested `oneOf` through the validator, so it is only worth asking
        // what the option declares once the fill is known to have something to write
        const refillableKeys = carriedKeys.filter(
          (key) => newDefaultsData[key] !== undefined && optionDeclaresValueFor(schemaUtils, newOptionForDefaults, key),
        );
        if (refillableKeys.length > 0) {
          /** Reports whether `key` still holds the value the old option would have put there. */
          const holdsOldDefault = (key: string) => {
            if (!oldOptionForDefaults || !optionDeclaresValueFor(schemaUtils, oldOptionForDefaults, key)) {
              return false;
            }
            const computed = defaultsForOldOption();
            return isPlainObject(computed) && deepEquals(computed[key], oldData[key]);
          };
          // Copy rather than delete from what `sanitizeDataForNewSchema()` returned: it builds a fresh object today,
          // but nothing in its contract promises that, and mutating it would reach the `formData` held in state
          const withoutBlockedKeys = { ...sanitizedData };
          refillableKeys.forEach((key) => {
            if (sanitizedData[key] === undefined || holdsOldDefault(key)) {
              delete withoutBlockedKeys[key];
            }
          });
          newFormData = withoutBlockedKeys;
        }
      }
    } else if (
      // An option that is not an object declares its value on the option itself, so the same rules apply to the
      // whole value rather than per key. In practice that means an array: `sanitizeDataForNewSchema()` carries
      // nothing else across, so a switch between two options of any other type arrives here already cleared and
      // is refilled below. The value has to stop matching more often than the fill has nothing to write, so it
      // is tested first
      newFormData !== undefined &&
      oldOptionForDefaults &&
      declaresOwnValue<S>(newOptionForDefaults) &&
      declaresOwnValue<S>(oldOptionForDefaults) &&
      deepEquals(defaultsForOldOption(), formData) &&
      defaultsForNewOption() !== undefined
    ) {
      newFormData = undefined;
    }
    // Call getDefaultFormState to make sure defaults are populated on change. Pass "excludeObjectChildren"
    // so that only the root objects themselves are created without adding undefined children properties. With
    // nothing carried over it is the same call the option's own defaults came from, so reuse those
    newFormData =
      newFormData === undefined
        ? defaultsForNewOption()
        : (schemaUtils.getDefaultFormState(
            newOptionForDefaults,
            newFormData,
            'excludeObjectChildren',
            undefined,
            newOptionUiSchema,
            uiSchemaDefinitions,
          ) as T);
  }
  return newFormData;
}
