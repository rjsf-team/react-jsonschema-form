import type {
  FieldPath,
  FieldPathList,
  FormContextType,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  deepEquals,
  DEFAULT_KEY,
  fieldPathFromList,
  getByPath,
  getXxxOfOptions,
  isPlainObject,
  isWholeValueSelect,
  PROPERTIES_KEY,
  REF_KEY,
  replaceEqualDeep,
  UI_DEFINITIONS_KEY,
} from '@rjsf/utils';

import { declaresValueFor } from './declaresValue.ts';

/** What the walk below needs that does not change as it descends */
interface StaleSearchOptions<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The path of the field whose change caused this schema change, so nothing the user just wrote is read as a
   * leftover default
   */
  changedPath: FieldPathList;
  /** The flag `Form`'s own fill is running with, so a `ui:initialValue` is applied here exactly as it was there */
  initialDefaultsGenerated: boolean;
  /** The form's uiSchema, indexed into per level so each key's `ui:initialValue`/`ui:emptyValue` applies */
  uiSchema?: UiSchema<T, S, F>;
  /** The paths the caller has already dropped on an earlier iteration of its loop, which are neither reported again
   * nor descended into
   */
  droppedPaths: ReadonlySet<FieldPath>;
}

/** The two sides' own `properties`, read and checked by the walk before it hands them on, so nothing below it has to
 * assert they are there
 */
interface LevelProperties {
  newProperties: Record<string, unknown>;
  oldProperties: Record<string, unknown>;
}

/** A key of the level being walked that the walk has resolved both sides of: one whose subschema was swapped, or the
 * key the change is inside, which is descended into whether or not it swapped
 */
interface SwappedKey<S extends StrictRJSFSchema> {
  key: string;
  /** The schema the key resolves to now */
  newSchema: S;
  /** The schema it resolved to for the data as it arrived */
  oldSchema: S;
  /** Worth a defaults computation to decide about: swapped, not the field the user just changed, carried a value
   * over, and declared by both branches. The reasoning behind each clause is on the exported function
   */
  isReplaceable: boolean;
}

/** Determines whether any `oneOf`/`anyOf` option of `level` describes the level's properties, which is what makes the
 * level one whose keys an option switch owns.
 *
 * A level may carry options that describe nothing of the sort — the `anyOf: [{ required: ['a'] }, { required: ['b'] }]`
 * "at least one of" idiom is the common case, and it can sit beside the very `if`/`then`/`else` that swapped a key.
 * Those options declare no properties, so no option's defaults can disagree with the fill about them and there is
 * nothing for the level to be skipped over.
 *
 * An option written as a `$ref` is resolved to answer for, since `retrieveSchema()` hands back the level's options as
 * they were declared and the most common way to write a `oneOf` is as a list of references. The resolution is reached
 * only by an option that declares no `properties` inline and does carry a `$ref`, so the inline case stays free.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to resolve a referenced option with
 * @param level - The level schema to test
 * @returns - True when the level carries options and at least one of them declares `properties`
 */
function optionsDeclareProperties<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  level: S,
): boolean {
  const options = getXxxOfOptions<S>(level)?.options ?? [];
  // `isPlainObject()`, since a boolean subschema is a legal option at runtime whatever the declared type says
  return options.some(
    (option) =>
      isPlainObject(option) &&
      (isPlainObject(option[PROPERTIES_KEY]) ||
        (REF_KEY in option && isPlainObject(schemaUtils.retrieveSchema(option)[PROPERTIES_KEY]))),
  );
}

/** Returns `schema` with its `properties` narrowed to `keys`. Every other keyword is kept, `default` above all: it is
 * what reaches each key as its `parentDefaults`, so dropping it would compute a different default than the form does.
 * Narrowing is what keeps a defaults computation proportional to the keys that were swapped rather than to the size of
 * the whole level, which is the cost that makes this affordable on a path that runs per change.
 *
 * @param schema - The level schema to narrow
 * @param properties - The level's own `properties`, which the walk has already read and checked
 * @param keys - The names of the properties to keep
 * @returns - The schema, describing only `keys`
 */
function onlyProperties<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  properties: Record<string, unknown>,
  keys: string[],
): S {
  return {
    ...schema,
    [PROPERTIES_KEY]: Object.fromEntries(keys.map((key) => [key, properties[key]])),
  };
}

/** Collects the keys of `newLevel` whose subschema is not the one `oldLevel` described for the data as it arrived.
 *
 * This runs for every declared key of every walked level on every change, while in the common case no key has
 * re-resolved at all, so the two free tests come first and between them end nearly every key: the old level has to
 * declare the key at all, and then an identical declaration holding an identical value, under an identical level
 * `default` for it, cannot have been swapped — a conditional nested inside a key reads that key's own data, and the
 * three places a value can be declared are covered between the key's schema and the level's `default`. That second
 * test compares by identity throughout, which `replaceEqualDeep()` makes meaningful for the two retrieved schemas as
 * well as for the two sets of form data. Every test after them costs something — a prototype walk, a symbol lookup,
 * and finally two resolutions — so each is reached only by a key that has already failed the cheaper ones.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to resolve each side with
 * @param newLevel - The level schema resolved for the data as it stands
 * @param oldLevel - The level schema resolved for the data as it arrived
 * @param levels - The two levels' own `properties`, which the walk has already read and checked
 * @param newValue - The level's value as it stands
 * @param oldValue - The level's value as it arrived
 * @param changedKey - The key of this level the user's change is at or within, if any
 * @returns - One entry per key the walk has to act on: every swapped key, and the changed key, which the walk
 *          descends into whether or not it swapped
 */
function swappedKeys<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  newLevel: S,
  oldLevel: S,
  levels: LevelProperties,
  newValue: Record<string, unknown>,
  oldValue: Record<string, unknown>,
  changedKey: string | undefined,
): SwappedKey<S>[] {
  const swapped: SwappedKey<S>[] = [];
  const { newProperties, oldProperties } = levels;
  const newLevelDefault = newLevel[DEFAULT_KEY];
  const oldLevelDefault = oldLevel[DEFAULT_KEY];
  // One identity test for the whole level, so the per-key reads below are reached only where the two sides can
  // actually disagree. A level that did not re-resolve is the same object on both sides, and `replaceEqualDeep()`
  // gives two that resolved alike the same `default` object, so this is false for every level nothing swapped at
  const levelDefaultsDiffer = newLevelDefault !== oldLevelDefault;
  Object.keys(newProperties).forEach((key) => {
    // A key the old level never declared held no default of its own to go stale. `Object.hasOwn()`, since a plain
    // read would answer for `toString` and the other names every object inherits
    if (!Object.hasOwn(oldProperties, key)) {
      return;
    }
    const newRaw = newProperties[key] as S;
    const oldRaw = oldProperties[key] as S;
    const newKeyValue = getByPath(newValue, key);
    const oldKeyValue = getByPath(oldValue, key);
    // A level declares a value for a key through its own `default` object as well as through the key's schema, and
    // that object lives outside `properties`. So an identical declaration holding an identical value is not enough to
    // end the key: a branch pair differing only in its level `default` swaps what the key should hold without
    // touching the key's schema at all, which is the one swap neither test below can see
    const levelDefaultSwapped =
      levelDefaultsDiffer && getByPath(newLevelDefault, key) !== getByPath(oldLevelDefault, key);
    // The changed key is exempt from the tests that end a key for having nothing that can go stale, since the walk
    // descends into it whether or not it was swapped and the descent needs its resolved pair. The two tests that end
    // it outright still do: a key the old level never declared, and one declared as a boolean subschema, have no pair
    // to resolve at all
    const isChangedKey = key === changedKey;
    const isUnchanged = newRaw === oldRaw && newKeyValue === oldKeyValue && !levelDefaultSwapped;
    if (isUnchanged && !isChangedKey) {
      return;
    }
    // The changed key is carried past the tests below for the walk to descend into it, and never to be replaced, so a
    // value that is not an object on both sides leaves it nothing to be carried for. Ending it here is what keeps a
    // keystroke in a leaf of a form with a nested conditional off the two resolutions below
    if (isChangedKey && (!isPlainObject(newKeyValue) || !isPlainObject(oldKeyValue))) {
      return;
    }
    // A boolean subschema declares no `default`, so it has nothing that can go stale, and being no object it can
    // answer neither the symbol test below nor `retrieveSchema()`
    if (!isPlainObject(newRaw) || !isPlainObject(oldRaw)) {
      return;
    }
    // A stubbed additional property is in `properties` only because the data holds the key, and `getDefaultFormState()`
    // fills one for a key the data lacks only before the form's initial defaults have been generated, so a value
    // removed from under a stub is never filled back in. It is still a level that can declare a conditional of its own
    const isStub = ADDITIONAL_PROPERTY_FLAG in newRaw;
    if (isStub && !isChangedKey) {
      return;
    }
    // Resolved new side first, so the shared base a resolution records for a raw schema is the one the old side's
    // resolution of that same schema is then compared against. Identical declarations holding identical values reach
    // here only as the changed key, and resolve to one schema rather than to two copies of it
    const resolvedNew = schemaUtils.retrieveSchema(newRaw, newKeyValue as T);
    const resolvedOld = isUnchanged ? resolvedNew : schemaUtils.retrieveSchema(oldRaw, oldKeyValue as T);
    const newSchema = replaceEqualDeep(resolvedOld, resolvedNew);
    const isSwapped = !isStub && (newSchema !== resolvedOld || levelDefaultSwapped);
    if (!isSwapped && !isChangedKey) {
      return;
    }
    swapped.push({
      key,
      newSchema,
      oldSchema: resolvedOld,
      isReplaceable:
        isSwapped &&
        !isChangedKey &&
        newKeyValue !== undefined &&
        oldKeyValue !== undefined &&
        declaresValueFor<S>(newLevel, key, newSchema) &&
        declaresValueFor<S>(oldLevel, key, resolvedOld),
    });
  });
  return swapped;
}

/** Reports the paths whose value is a default the subschema that has just been swapped away put there, so that
 * `Form`'s own fill can replace each one with the newly selected subschema's default.
 *
 * `sanitizeDataForNewSchema()` compares a key's old and new `default` only where the key holds a scalar; an `object`
 * or `array` property is recursed into instead, and the recursion finds no per-leaf default to compare, so a value
 * the previous branch's `default` put there outlasts the swap and the new branch's `default` never reaches a key that
 * already holds something ([#5349](https://github.com/rjsf-team/react-jsonschema-form/issues/5349)). This is the
 * dependency-driven counterpart of `formDataForNewOption()`, which closes the same gap at a `oneOf`/`anyOf` switch and
 * shares this one's rule for what a branch declares, through `declaresValueFor()`.
 *
 * Only paths are reported, and nothing here writes to the data: the caller deletes each one and lets the fill it
 * already runs produce the replacement. Deleting is what makes the replacement happen at all, since
 * `getDefaultFormState()` fills a key the data lacks but leaves one explicitly set to `undefined` alone, and it also
 * means the value written is the form's own computation rather than a copy of some schema's `default`.
 *
 * Staleness is judged against the data **as it arrived**. The fill at the top of the caller's pass has already merged
 * the newly selected branch's own leaf defaults into the value, so a key whose new branch declares a property the old
 * one did not no longer resembles the default it came from.
 *
 * A key qualifies only when all of the following hold, which between them keep a report from stranding data the user
 * or the caller supplied. They are tested in that order, cheapest first: only the last two cost a defaults
 * computation, and the old side's is what decides whether the new side's is computed at all.
 *
 * - Its subschema was swapped, which is what `swappedKeys()` establishes per key rather than by comparing whole root
 *   schemas: the old side is read by resolving the old declaration against the old data.
 * - It is not the field the user just changed, nor an ancestor of it. The value there is theirs, whatever it equals.
 * - **Both** branches declare a value for it, as a property `default`/`const` or through the branch's own `default`
 *   object. The computed defaults say more than a branch declares, and that cuts both ways: reading them as the new
 *   branch's wish would replace an untouched value with `{}` for a required object or `[]` for a required array, and
 *   reading them as the old branch's would treat a required boolean's `false`, a required array's `[]` or a
 *   `minItems` fill as the old branch's own default and overwrite whatever the user left there.
 * - It still holds the default the branch being swapped away would have put there. A value edited away from that
 *   default no longer matches and is kept.
 * - The newly selected branch's computed defaults also hold something for it, so the fill is certain to put a value
 *   back. What a branch declares and what the fill writes are not the same set: a `default` reached through `allOf`
 *   or `if`/`then` resolves but is not filled, a `const` is skipped entirely under `constAsDefaults: 'never'`, and a
 *   `defaultFormStateBehavior` of `populateRequiredDefaults` or `skipDefaults` writes nothing for a key that is
 *   neither. The two branches also have to compute *different* defaults: nothing is stale when they agree, and a
 *   branch pair that differs in some other way — a `title`, a `description` — would otherwise have its value deleted
 *   and refilled with the same thing on every change.
 *
 * Both sets of defaults are computed with `includeUndefinedValues` of `false`, the flag `Form`'s own fill uses —
 * deliberately unlike `formDataForNewOption()`, whose fill is its own `'excludeObjectChildren'` call. The two
 * disagree about which keys appear at all, so comparing against the wrong one would read a key as stale that the fill
 * never wrote.
 *
 * The walk descends into every swapped key, and into the key the change is inside whether or not that key resolved
 * differently — it is carried in the same list for that, and only while both sides hold a plain object, a value that
 * is not one having no level to walk. Descending into a key that did not swap is what reaches a conditional more than
 * one level down: `retrieveSchema()` resolves only the conditionals declared on the schema it is handed, so an
 * ancestor of the level that swapped resolves identically on both sides and would otherwise end the walk above it. It
 * widens the search to no key the change is not inside, since a swap can only be decided by a conditional on a level
 * the change is within.
 *
 * Values are matched whole, per key of the level that declares the default, which is what decides how much of a value
 * a branch speaks for. A `default` on the object itself declares that object's own keys, so an untouched leaf is
 * replaced while an edited sibling is kept; a `default` one level up declares the whole object, which an edit to any
 * leaf stops matching, so all of it stays. Array elements are not walked at all, for two separate reasons: an `items`
 * `default` is only replaced where the array itself is the swapped key, since replacing each element matching the old
 * one would break `uniqueItems` and reassign a deliberate pick; and a conditional on an object *inside* an element is
 * not reached either, so a swap decided there is left alone.
 *
 * None of this is reached at all for a change whose own value is an object or an array, since the caller only
 * sanitizes such a change when it is a whole-value select, and the search runs where sanitizing does.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to resolve schemas and compute defaults with
 * @param newSchema - The schema resolved for the data as it stands
 * @param oldSchema - The schema resolved for the data as it arrived
 * @param newFormData - The data as it stands, whose keys are the ones that can be reported
 * @param oldFormData - The data as it arrived, which is what staleness is judged against
 * @param options - The change's path and the flags the defaults are computed with
 * @returns - The path of each value holding a swapped-away subschema's default, in walk order. No path is an
 *          ancestor of another, since a key reported stale is not descended into, so the caller may drop them in any
 *          order
 */
export default function stalePathsForNewSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  newSchema: S,
  oldSchema: S,
  newFormData: T | undefined,
  oldFormData: T | undefined,
  options: StaleSearchOptions<T, S, F>,
): FieldPathList[] {
  const { changedPath, droppedPaths, initialDefaultsGenerated, uiSchema } = options;
  const uiSchemaDefinitions = uiSchema?.[UI_DEFINITIONS_KEY];
  const stalePaths: FieldPathList[] = [];

  /** Walks one object level, reporting its stale keys and descending into the keys that are not stale themselves.
   *
   * `changedKey` is the key of THIS level that the user's change is at or within, which the parent decides as it
   * descends rather than each level re-deriving from `changedPath`: the walk descends into every swapped key, so a
   * sibling level is reached at the same depth and a bare `changedPath[depth]` would read a key that merely shares
   * the changed field's name as the change.
   */
  const walkLevel = (
    newLevel: S,
    oldLevel: S,
    newValue: unknown,
    oldValue: unknown,
    levelPath: FieldPathList,
    changedKey: string | undefined,
  ) => {
    const newProperties = newLevel[PROPERTIES_KEY];
    const oldProperties = oldLevel[PROPERTIES_KEY];
    if (
      !isPlainObject(newProperties) ||
      !isPlainObject(oldProperties) ||
      !isPlainObject(newValue) ||
      !isPlainObject(oldValue)
    ) {
      return;
    }
    const levels = { newProperties, oldProperties };
    // A key already dropped is left out before anything is computed for it. It stays swapped relative to the data as
    // it arrived, and on the old side it still holds that branch's default, so every later iteration would report it
    // again for the caller to discard — paying both narrowed defaults computations each time. The caller cannot drop
    // it twice anyway: the value there is the replacement the fill has since written
    const swapped = swappedKeys<T, S, F>(
      schemaUtils,
      newLevel,
      oldLevel,
      levels,
      newValue,
      oldValue,
      changedKey,
    ).filter((entry) => !droppedPaths.has(fieldPathFromList([...levelPath, entry.key])));
    const replaceableKeys = swapped.flatMap((entry) => (entry.isReplaceable ? [entry.key] : []));
    let staleKeys: Set<string> | undefined;
    // A level whose options describe its properties is `formDataForNewOption()`'s to switch, and the option
    // `computeDefaults()` picks for a level with no data of its own need not be the one the fill picks for the data
    // there is. Either side disqualifies the level: both are asked for their defaults, and both from no data. Only
    // this level's own defaults are off limits, though — the walk still descends, since a conditional declared on one
    // of this level's properties is nothing to do with the options here and is reachable no other way. Asked after
    // the keys, and only once one of them is replaceable: an option written as a `$ref` costs a `retrieveSchema()`
    // to answer for, and the answer is wanted nowhere but here
    if (
      replaceableKeys.length > 0 &&
      !optionsDeclareProperties<T, S, F>(schemaUtils, newLevel) &&
      // The old side only differs where the level itself re-resolved, and asking costs a resolution per `$ref` option
      (newLevel === oldLevel || !optionsDeclareProperties<T, S, F>(schemaUtils, oldLevel))
    ) {
      const levelUiSchema = levelPath.length ? getByPath<UiSchema<T, S, F> | undefined>(uiSchema, levelPath) : uiSchema;
      const computeFor = (level: S, keys: string[]) => {
        const defaults = schemaUtils.getDefaultFormState(
          onlyProperties<S>(level, level === newLevel ? newProperties : oldProperties, keys),
          undefined,
          false,
          initialDefaultsGenerated,
          levelUiSchema,
          uiSchemaDefinitions,
        );
        return isPlainObject(defaults) ? defaults : {};
      };
      // The old side decides which keys still hold what the branch being swapped away put there. Once the user has
      // edited them that is none of them, and the new side's defaults are then never computed at all
      const oldDefaults = computeFor(oldLevel, replaceableKeys);
      const holdingKeys = replaceableKeys.filter((key) =>
        deepEquals(getByPath(oldDefaults, key), getByPath(oldValue, key)),
      );
      if (holdingKeys.length > 0) {
        const newDefaults = computeFor(newLevel, holdingKeys);
        holdingKeys.forEach((key) => {
          const newDefault = getByPath(newDefaults, key);
          if (newDefault !== undefined && !deepEquals(getByPath(oldDefaults, key), newDefault)) {
            staleKeys = (staleKeys ?? new Set<string>()).add(key);
          }
        });
      }
    }

    const descend = (key: string, newKeySchema: S, oldKeySchema: S) => {
      // A select over object constants holds one of them whole, so it is a value to replace rather than a level to
      // walk, exactly as `sanitizeDataForNewSchema()` reads one
      if (isWholeValueSelect<S>(newKeySchema)) {
        return;
      }
      walkLevel(
        newKeySchema,
        oldKeySchema,
        getByPath(newValue, key),
        getByPath(oldValue, key),
        [...levelPath, key],
        key === changedKey ? changedPath[levelPath.length + 1]?.toString() : undefined,
      );
    };

    swapped.forEach(({ key, newSchema: newKeySchema, oldSchema: oldKeySchema }) => {
      if (staleKeys?.has(key)) {
        stalePaths.push([...levelPath, key]);
        return;
      }
      descend(key, newKeySchema, oldKeySchema);
    });
  };

  // `toString()`, so a numeric path segment and its string form address the one key
  walkLevel(newSchema, oldSchema, newFormData, oldFormData, [], changedPath[0]?.toString());
  return stalePaths;
}
