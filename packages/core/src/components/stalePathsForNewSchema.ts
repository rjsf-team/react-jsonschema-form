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
  getPropertySchema,
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
  /** The key holds, or contains, the field the user just changed, so its value is theirs and not a default */
  isChanged: boolean;
  /** Both sides describe an object whose properties can be walked for a swap one level further down */
  isWalkable: boolean;
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
 * Resolving is the expensive part, so two free tests come first. An identical raw schema and an identical value
 * cannot resolve to anything different, since a conditional nested inside a key reads that key's own data; both
 * comparisons are by identity, which `replaceEqualDeep()` makes meaningful for the two retrieved schemas as well as
 * for the two sets of form data.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to resolve each side with
 * @param newLevel - The level schema resolved for the data as it stands
 * @param oldLevel - The level schema resolved for the data as it arrived
 * @param newValue - The level's value as it stands
 * @param oldValue - The level's value as it arrived
 * @param levelPath - The path of the level within the form data
 * @param changedPath - The path of the field the user changed
 * @returns - One entry per key whose subschema was swapped, in `newLevel.properties` order
 */
function swappedKeys<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  newLevel: S,
  oldLevel: S,
  newValue: Record<string, unknown>,
  oldValue: Record<string, unknown>,
  levelPath: FieldPathList,
  changedPath: FieldPathList,
): SwappedKey<S>[] {
  const swapped: SwappedKey<S>[] = [];
  const oldProperties = oldLevel[PROPERTIES_KEY];
  // `changedPath[levelPath.length]` names a key of THIS level only where the level itself is on the changed field's
  // own branch. The walk descends into every swapped key, so a sibling level is reached at the same depth and would
  // otherwise read a key that merely shares the changed field's name as the change
  const isLevelOnChangedPath = levelPath.every((segment, index) => changedPath[index] === segment);
  Object.keys(newLevel[PROPERTIES_KEY]!).forEach((key) => {
    const newRaw = getPropertySchema<S>(newLevel, key);
    // A property may be declared as a boolean subschema (`properties: { a: true }`), which states only whether the
    // key is allowed at all. It declares no `default`, so it has nothing that can go stale, and being no object it
    // can answer neither the symbol test below nor `retrieveSchema()`
    if (!isPlainObject(newRaw)) {
      return;
    }
    // A stubbed additional property is in `properties` only because the data holds the key, and `getDefaultFormState()`
    // fills one for a key the data lacks only before the form's initial defaults have been generated, so a value
    // removed from under a stub is never filled back in
    if (ADDITIONAL_PROPERTY_FLAG in newRaw) {
      return;
    }
    // A key the old level never declared held no default of its own to go stale. It also has no old raw schema to
    // compare against: `getPropertySchema()` answers with a fresh empty schema, which is equal to nothing
    if (!oldProperties || !Object.hasOwn(oldProperties, key)) {
      return;
    }
    const newKeyValue = newValue[key];
    const oldKeyValue = oldValue[key];
    const oldRaw = getPropertySchema<S>(oldLevel, key);
    if (!isPlainObject(oldRaw) || (oldRaw === newRaw && oldKeyValue === newKeyValue)) {
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
      isChanged: isLevelOnChangedPath && changedPath[levelPath.length] === key,
      // A select over object constants holds one of them whole, so it is a value to replace rather than a level to
      // walk, exactly as `sanitizeDataForNewSchema()` reads one
      isWalkable: !isWholeValueSelect<S>(newSchema),
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

  /** Walks one object level, reporting its stale keys and descending into the keys that are not stale themselves. */
  const walkLevel = (newLevel: S, oldLevel: S, newValue: unknown, oldValue: unknown, levelPath: FieldPathList) => {
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
    const swapped = swappedKeys<T, S, F>(schemaUtils, newLevel, oldLevel, newValue, oldValue, levelPath, changedPath);
    /** Whether `entry`'s value could be a swapped-away branch's default, which is what the defaults below are
     * computed to decide. A key the data did not arrive holding cannot hold a default of the branch being swapped
     * away: whatever is there now is the fill's own work from this very pass, and dropping it would only have the
     * fill write it again — at the cost of another sanitize round, and of exposing a conditional that reads the
     * key's presence to a pass where it is absent
     */
    const isReplaceable = (entry: SwappedKey<S>) =>
      !entry.isChanged && newValue[entry.key] !== undefined && oldValue[entry.key] !== undefined;
    const replaceable = swapped.filter(isReplaceable);
    let levelDefaults: { old: Record<string, unknown>; new: Record<string, unknown> } | undefined;
    /** Computes both sides' defaults for `replaceable` at most once, and only once a key needs them. */
    const defaultsForLevel = () => {
      if (!levelDefaults) {
        const keys = replaceable.map((entry) => entry.key);
        const levelUiSchema = levelPath.length
          ? getByPath<UiSchema<T, S, F> | undefined>(uiSchema, levelPath)
          : uiSchema;
        const computeFor = (level: S) =>
          schemaUtils.getDefaultFormState(
            onlyProperties<S>(level, keys),
            undefined,
            false,
            initialDefaultsGenerated,
            levelUiSchema,
            uiSchemaDefinitions,
          );
        const oldDefaults = computeFor(oldLevel);
        const newDefaults = computeFor(newLevel);
        levelDefaults = {
          old: isPlainObject(oldDefaults) ? oldDefaults : {},
          new: isPlainObject(newDefaults) ? newDefaults : {},
        };
      }
      return levelDefaults;
    };

    swapped.forEach((entry) => {
      const { key, isWalkable, newSchema: newKeySchema, oldSchema: oldKeySchema } = entry;
      const oldKeyValue = oldValue[key];
      if (isReplaceable(entry)) {
        const defaults = defaultsForLevel();
        if (
          defaults.new[key] !== undefined &&
          !deepEquals(defaults.old[key], defaults.new[key]) &&
          deepEquals(defaults.old[key], oldKeyValue)
        ) {
          stalePaths.push([...levelPath, key]);
          return;
        }
      }
      if (isWalkable) {
        walkLevel(newKeySchema, oldKeySchema, newValue[key], oldKeyValue, [...levelPath, key]);
      }
    });
  };

  walkLevel(newSchema, oldSchema, newFormData, oldFormData, []);
  return stalePaths;
}
