import type {
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
  getByPath,
  getXxxOfKey,
  isPlainObject,
  isWholeValueSelect,
  PROPERTIES_KEY,
  replaceEqualDeep,
  UI_DEFINITIONS_KEY,
} from '@rjsf/utils';

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
}

/** A key of the level being walked whose subschema was swapped for another one */
interface SwappedKey<S extends StrictRJSFSchema> {
  key: string;
  /** The schema the key resolves to now */
  newSchema: S;
  /** The schema it resolved to for the data as it arrived */
  oldSchema: S;
  /** The key could be holding a swapped-away branch's default, so it is worth computing this level's defaults to
   * decide. It is not the field the user just changed, and it carried a value over: a key the data did not arrive
   * holding cannot hold the old branch's default, since whatever is there now is this very pass's own fill
   */
  isReplaceable: boolean;
}

/** Returns `schema` with its `properties` narrowed to `keys`. Every other keyword is kept, `default` above all: it is
 * what reaches each key as its `parentDefaults`, so dropping it would compute a different default than the form does.
 * Narrowing is what keeps a defaults computation proportional to the keys that were swapped rather than to the size of
 * the whole level, which is the cost that makes this affordable on a path that runs per change.
 *
 * @param schema - The level schema to narrow
 * @param keys - The names of the properties to keep
 * @returns - The schema, describing only `keys`
 */
function onlyProperties<S extends StrictRJSFSchema = RJSFSchema>(schema: S, keys: string[]): S {
  const properties = schema[PROPERTIES_KEY];
  return {
    ...schema,
    [PROPERTIES_KEY]: Object.fromEntries(keys.map((key) => [key, properties![key]])),
  };
}

/** Collects the keys of `newLevel` whose subschema is not the one `oldLevel` described for the data as it arrived.
 *
 * This runs for every declared key of every walked level on every change, while in the common case no key has
 * re-resolved at all, so the two free tests come first and between them end nearly every key: the old level has to
 * declare the key at all, and then an identical declaration with an identical value cannot resolve to anything
 * different, since a conditional nested inside a key reads that key's own data. That second test compares by
 * identity on both halves, which `replaceEqualDeep()` makes meaningful for the two retrieved schemas as well as for
 * the two sets of form data. Every test after them costs something — a prototype walk, a symbol lookup, and finally
 * two resolutions — so each is reached only by a key that has already failed the cheaper ones.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to resolve each side with
 * @param newLevel - The level schema resolved for the data as it stands
 * @param oldLevel - The level schema resolved for the data as it arrived
 * @param newValue - The level's value as it stands
 * @param oldValue - The level's value as it arrived
 * @param changedKey - The key of this level the user's change is at or within, if any
 * @returns - One entry per key whose subschema was swapped, in `newLevel.properties` order
 */
function swappedKeys<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  newLevel: S,
  oldLevel: S,
  newValue: Record<string, unknown>,
  oldValue: Record<string, unknown>,
  changedKey: string | undefined,
): SwappedKey<S>[] {
  const swapped: SwappedKey<S>[] = [];
  const newProperties = newLevel[PROPERTIES_KEY]!;
  const oldProperties = oldLevel[PROPERTIES_KEY];
  if (!oldProperties) {
    return swapped;
  }
  Object.keys(newProperties).forEach((key) => {
    // A key the old level never declared held no default of its own to go stale. `Object.hasOwn()`, since a plain
    // read would answer for `toString` and the other names every object inherits
    if (!Object.hasOwn(oldProperties, key)) {
      return;
    }
    const newRaw = newProperties[key] as S;
    const oldRaw = oldProperties[key] as S;
    const newKeyValue = newValue[key];
    const oldKeyValue = oldValue[key];
    if (newRaw === oldRaw && newKeyValue === oldKeyValue) {
      return;
    }
    // A property may be declared as a boolean subschema (`properties: { a: true }`), which states only whether the
    // key is allowed at all. It declares no `default`, so it has nothing that can go stale, and being no object it
    // can answer neither the symbol test below nor `retrieveSchema()`
    if (!isPlainObject(newRaw) || !isPlainObject(oldRaw)) {
      return;
    }
    // A stubbed additional property is in `properties` only because the data holds the key, and `getDefaultFormState()`
    // fills one for a key the data lacks only before the form's initial defaults have been generated, so a value
    // removed from under a stub is never filled back in
    if (ADDITIONAL_PROPERTY_FLAG in newRaw) {
      return;
    }
    // Resolved new side first, so the shared base a resolution records for a raw schema is the one the old side's
    // resolution of that same schema is then compared against
    const resolvedNew = schemaUtils.retrieveSchema(newRaw, newKeyValue as T);
    const resolvedOld = schemaUtils.retrieveSchema(oldRaw, oldKeyValue as T);
    const newSchema = replaceEqualDeep(resolvedOld, resolvedNew);
    if (newSchema === resolvedOld) {
      return;
    }
    swapped.push({
      key,
      newSchema,
      oldSchema: resolvedOld,
      isReplaceable: key !== changedKey && newKeyValue !== undefined && oldKeyValue !== undefined,
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
 * dependency-driven counterpart of `formDataForNewOption()`, which closes the same gap at a `oneOf`/`anyOf` switch.
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
 * or the caller supplied:
 *
 * - Its subschema was swapped, which is what `swappedKeys()` establishes per key rather than by comparing whole root
 *   schemas: the old side is read by resolving the old declaration against the old data.
 * - It is not the field the user just changed, nor an ancestor of it. The value there is theirs, whatever it equals.
 * - The two branches compute different defaults for it. Nothing is stale when they agree, and a branch pair that
 *   differs in some other way — a `title`, a `description` — would otherwise have its value deleted and refilled with
 *   the same thing on every change.
 * - The newly selected branch's defaults hold something for it, so the fill is certain to put a value back. What a
 *   branch declares and what the fill writes are not the same set: a `default` reached through `allOf` or `if`/`then`
 *   resolves but is not filled, a `const` is skipped entirely under `constAsDefaults: 'never'`, and a
 *   `defaultFormStateBehavior` of `populateRequiredDefaults` or `skipDefaults` writes nothing for a key that is
 *   neither.
 * - It still holds the default the branch being swapped away would have put there. A value edited away from that
 *   default no longer matches and is kept.
 *
 * Both sets of defaults are computed with `includeUndefinedValues` of `false`, the flag `Form`'s own fill uses —
 * deliberately unlike `formDataForNewOption()`, whose fill is its own `'excludeObjectChildren'` call. The two
 * disagree about which keys appear at all, so comparing against the wrong one would read a key as stale that the fill
 * never wrote.
 *
 * Values are matched whole, per key of each level: editing one leaf of a nested object leaves the whole subtree in
 * place, so its other leaves keep the old branch's defaults. Array elements are not walked, so an `items` `default`
 * is only replaced where the array itself is the swapped key — replacing each element that matches the old `items`
 * default would break `uniqueItems` and reassign a deliberate pick.
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
  const { changedPath, initialDefaultsGenerated, uiSchema } = options;
  const uiSchemaDefinitions = uiSchema?.[UI_DEFINITIONS_KEY];
  const stalePaths: FieldPathList[] = [];

  /** The name a path segment addresses a property by, so a numeric segment and its string form are one key */
  const keyName = (segment: FieldPathList[number] | undefined) => (segment === undefined ? undefined : String(segment));

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
    if (
      !isPlainObject(newLevel[PROPERTIES_KEY]) ||
      !isPlainObject(oldLevel[PROPERTIES_KEY]) ||
      !isPlainObject(newValue) ||
      !isPlainObject(oldValue) ||
      // A level carrying `oneOf`/`anyOf` is `formDataForNewOption()`'s to switch, and the option `computeDefaults()`
      // picks for a level with no data of its own need not be the one the fill picks for the data there is. Either
      // side disqualifies the level: both are asked for their defaults, and both are asked for them from no data
      getXxxOfKey<S>(newLevel) ||
      getXxxOfKey<S>(oldLevel)
    ) {
      return;
    }
    const swapped = swappedKeys<T, S, F>(schemaUtils, newLevel, oldLevel, newValue, oldValue, changedKey);
    const replaceableKeys = swapped.flatMap((entry) => (entry.isReplaceable ? [entry.key] : []));
    // Both sides' defaults, indexed by key, for the keys worth deciding about — empty when there are none, which is
    // every level the walk passes through without finding a swap
    let oldDefaults: Record<string, unknown> = {};
    let newDefaults: Record<string, unknown> = {};
    if (replaceableKeys.length > 0) {
      const levelUiSchema = levelPath.length ? getByPath<UiSchema<T, S, F> | undefined>(uiSchema, levelPath) : uiSchema;
      const computeFor = (level: S) => {
        const defaults = schemaUtils.getDefaultFormState(
          onlyProperties<S>(level, replaceableKeys),
          undefined,
          false,
          initialDefaultsGenerated,
          levelUiSchema,
          uiSchemaDefinitions,
        );
        return isPlainObject(defaults) ? defaults : {};
      };
      oldDefaults = computeFor(oldLevel);
      newDefaults = computeFor(newLevel);
    }

    swapped.forEach(({ key, isReplaceable, newSchema: newKeySchema, oldSchema: oldKeySchema }) => {
      const oldKeyValue = oldValue[key];
      if (
        isReplaceable &&
        newDefaults[key] !== undefined &&
        !deepEquals(oldDefaults[key], newDefaults[key]) &&
        deepEquals(oldDefaults[key], oldKeyValue)
      ) {
        stalePaths.push([...levelPath, key]);
        return;
      }
      // A select over object constants holds one of them whole, so it is a value to replace rather than a level to
      // walk, exactly as `sanitizeDataForNewSchema()` reads one
      if (!isWholeValueSelect<S>(newKeySchema)) {
        walkLevel(
          newKeySchema,
          oldKeySchema,
          newValue[key],
          oldKeyValue,
          [...levelPath, key],
          key === changedKey ? keyName(changedPath[levelPath.length + 1]) : undefined,
        );
      }
    });
  };

  walkLevel(newSchema, oldSchema, newFormData, oldFormData, [], keyName(changedPath[0]));
  return stalePaths;
}
