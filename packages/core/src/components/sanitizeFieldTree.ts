import type { FieldPathList, FormContextType, SchemaUtilsType, StrictRJSFSchema } from '@rjsf/utils';
import {
  CONST_KEY,
  deepEquals,
  DEFAULT_KEY,
  expandRefCycle,
  fieldPathFromList,
  getByPath,
  getDiscriminatorFieldFromSchema,
  getRenderedOptionSchema,
  getXxxOfOptions,
  GUESSED_TYPE_FLAG,
  isConstantOptionList,
  isObject,
  isPlainObject,
  isSchemaObject,
  isWholeValueSelect,
  rendersOwnFieldBesideOption,
  RJSF_REF_CYCLE_KEY,
  setOwn,
  toConstant,
} from '@rjsf/utils';

import type { FieldEdit, KeyMove } from './formState.ts';
import type { UiState } from './uiState.ts';
import { asFieldValue, isPathPrefix, optionListKey, retrievedOptionsOf, shownOption } from './uiState.ts';

/** What the tree diff needs that does not change as it descends */
interface TreeContext<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The schema utilities the previous tree is built with */
  oldSchemaUtils: SchemaUtilsType<T, S, F>;
  /** The schema utilities the new tree is built with */
  schemaUtils: SchemaUtilsType<T, S, F>;
  uiState: UiState;
  /** The path of the change being made, if there is one: the value there is the user's, and the selections at or
   * above it hold
   */
  editedPath?: FieldPathList;
  /** Where the change moved the keys of the array or object at `editedPath`, if it moved any */
  newKeyOf?: KeyMove;
}

/** A field tree's schema utilities, its data, and the root schema they retrieve for that data */
export interface FieldTree<T, S extends StrictRJSFSchema, F extends FormContextType> {
  schemaUtils: SchemaUtilsType<T, S, F>;
  formData?: T;
  retrievedSchema: S;
}

/** Whether `path` is the edited path or one of its ancestors */
function isEdited<T, S extends StrictRJSFSchema, F extends FormContextType>(
  { editedPath }: TreeContext<T, S, F>,
  path: FieldPathList,
): boolean {
  return editedPath !== undefined && isPathPrefix(path, editedPath);
}

/** Where the value of each key of the array or object at `path` was before the change: under the key the change moved
 * to it, where `path` is the edited path, and otherwise under the key itself. An array written whole at the edited path
 * with no move announced, as `setFieldValue()` writes one, has each item that holds what an item of the array held
 * before paired with that item, the one at its own index first: equal data under the same item schema has the same
 * constraints, so a reorder set back keeps the constraints its rows had (#5451). A tuple's items are paired by index,
 * since each index has a schema of its own
 *
 * @param ctx - The diff's context
 * @param path - The path of the array or object
 * @param previous - What it held before the change
 * @param [written] - For an array, the items it holds now, and whether its items are a tuple
 * @returns - The key each key's value was under before the change, undefined for a value the change brought
 */
function previousKeys<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  path: FieldPathList,
  previous: unknown,
  written?: { items: readonly unknown[]; isTuple: boolean },
): (key: string) => string | undefined {
  const { newKeyOf, editedPath } = ctx;
  if (path.length !== editedPath?.length || !isEdited(ctx, path)) {
    return (key) => key;
  }
  const oldKeyOf = new Map<string, string>();
  if (newKeyOf) {
    if (isObject(previous) || Array.isArray(previous)) {
      for (const oldKey of Object.keys(previous)) {
        const newKey = newKeyOf(oldKey);
        if (newKey !== undefined && !oldKeyOf.has(newKey)) {
          oldKeyOf.set(newKey, oldKey);
        }
      }
    }
    return (key) => oldKeyOf.get(key);
  }
  if (!written || written.isTuple || !Array.isArray(previous)) {
    return (key) => key;
  }
  const paired = new Set<number>();
  written.items.forEach((item, index) => {
    const isOwn = index < previous.length && !paired.has(index) && deepEquals(item, previous[index]);
    const oldIndex = isOwn ? index : previous.findIndex((old, at) => !paired.has(at) && deepEquals(item, old));
    if (oldIndex >= 0) {
      paired.add(oldIndex);
      oldKeyOf.set(String(index), String(oldIndex));
    }
  });
  return (key) => oldKeyOf.get(key) ?? key;
}

/** The value `container` holds under `key`, if any */
function valueAt(container: unknown, key: string | undefined): unknown {
  return key === undefined ? undefined : getByPath(container, key);
}

/** A value the diff removes from the data */
const DROP = Symbol('drop');

/** The schemas a field renders, outermost first: the field's own, and the selected option's where it has options, which
 * renders at the same path, and so on for an option's own options. None for a collapsed `$ref` cycle that is not
 * expanded, which renders no field beneath its Expand button. Follows `SchemaField`, `MultiSchemaField` and
 * `CyclicSchemaField` as far as the schema decides them: no `uiSchema` is read, so a field whose `uiSchema` keeps its
 * options from rendering, as `ui:fieldReplacesAnyOrOneOf` does, is still taken to show one. `retrieved` is `raw` retrieved for `value`, when
 * the caller has it. `shown` maps each option list, by `optionListKey()`, to the option shown from it: an entry is
 * taken in place of the selection, and a list without one is added with the option shown for `value`.
 */
function layersOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  schemaUtils: SchemaUtilsType<T, S, F>,
  raw: S,
  value: unknown,
  path: FieldPathList,
  shown: Map<string, number>,
  retrieved?: S,
): S[] {
  const { uiState } = ctx;
  const rootSchema = schemaUtils.getRootSchema();
  const data = asFieldValue<T>(value);
  let schema = raw;
  if (Reflect.get(schema, RJSF_REF_CYCLE_KEY)) {
    if (!uiState.isExpanded(fieldPathFromList(path))) {
      return [];
    }
    schema = expandRefCycle<S>(schema, rootSchema);
  }
  const view = retrieved ?? schemaUtils.retrieveSchema(schema, data);
  const options = retrievedOptionsOf<T, S, F>(schemaUtils, view, data);
  if (!options) {
    return [view];
  }
  const list = optionListKey<S>(options, rootSchema);
  const given = list === '' ? undefined : shown.get(list);
  const index =
    given !== undefined && given < options.length
      ? given
      : shownOption<T, S, F>(
          schemaUtils,
          uiState.selection(fieldPathFromList(path), list),
          options,
          data,
          getDiscriminatorFieldFromSchema<S>(view),
          isEdited(ctx, path),
        );
  shown.set(list, index);
  if (index < 0) {
    return [view];
  }
  const own = rendersOwnFieldBesideOption<S>(view) ? schemaUtils.retrieveSchema(schema, data, false, index) : view;
  return [own, ...layersOf(ctx, schemaUtils, getRenderedOptionSchema<S>(view, options[index]), value, path, shown)];
}

/** The innermost layer's `keyword`, which is the one the value is rendered under */
function keywordOf<S extends StrictRJSFSchema>(layers: readonly S[], keyword: string): unknown {
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    if (Object.hasOwn(layers[i], keyword)) {
      return Reflect.get(layers[i], keyword);
    }
  }
  return undefined;
}

/** A type guessed from an extra key's data describes the data rather than the schema, so it is no type */
function typeOf<S extends StrictRJSFSchema>(layers: readonly S[]): unknown {
  return layers.some((layer) => GUESSED_TYPE_FLAG in layer) ? undefined : keywordOf(layers, 'type');
}

/** The values a field offers: its `enum`, or the constants of options that are all constants */
function offeredValues<S extends StrictRJSFSchema>(layers: readonly S[]): unknown[] | undefined {
  const enumValues = keywordOf(layers, 'enum');
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    const values: unknown[] = enumValues;
    return values;
  }
  const last = layers[layers.length - 1];
  const options = last && getXxxOfOptions<S>(last)?.options;
  if (!options || !isConstantOptionList<S>(options, true)) {
    return undefined;
  }
  return options.map((option) => toConstant<S>(option));
}

/** Whether two `type`s name the same types, a list by what it names */
function isSameType(oldType: unknown, newType: unknown): boolean {
  if (Array.isArray(oldType) && Array.isArray(newType)) {
    return oldType.length === newType.length && oldType.every((type) => newType.includes(type));
  }
  return oldType === newType;
}

/** What a field's value is judged by: the keywords whose change can make the value one the field no longer holds */
function constraintsOf<S extends StrictRJSFSchema>(layers: readonly S[], declaredDefault: unknown) {
  return {
    type: typeOf(layers),
    const: keywordOf(layers, CONST_KEY),
    values: offeredValues(layers),
    maxItems: keywordOf(layers, 'maxItems'),
    declaredDefault,
  };
}

/** Re-judges a value whose field's constraints changed. A value equal to the default the old schema declared for it
 * is that schema's, so it becomes the new schema's default; a value of another type, or one the new `const` or `enum`
 * rejects, is replaced as `sanitizeDataForNewSchema()` replaces it, or dropped.
 *
 * @returns - The value to hold, `DROP` to remove it, or `undefined` to keep it and judge what it holds
 */
function judge<S extends StrictRJSFSchema>(
  oldLayers: readonly S[],
  newLayers: readonly S[],
  value: unknown,
  oldDefault: unknown,
  newDefault: unknown,
  isItem: boolean,
): unknown {
  const before = constraintsOf(oldLayers, oldDefault);
  const now = constraintsOf(newLayers, newDefault);
  if (deepEquals(before, now)) {
    return undefined;
  }
  if (oldDefault !== undefined && newDefault !== undefined && deepEquals(oldDefault, value)) {
    return deepEquals(newDefault, value) ? undefined : structuredClone(newDefault);
  }
  if (before.type !== undefined && !isSameType(before.type, now.type)) {
    return DROP;
  }
  if (now.const !== undefined && !deepEquals(now.const, value)) {
    return deepEquals(before.const, value) ? now.const : DROP;
  }
  const { values } = now;
  if (values && !values.some((offered) => deepEquals(offered, value))) {
    if (isItem) {
      return DROP;
    }
    if (values.some((offered) => deepEquals(offered, newDefault))) {
      return structuredClone(newDefault);
    }
    return values.length === 1 ? values[0] : DROP;
  }
  return undefined;
}

/** The subschemas the properties of a field are rendered with, an option's over the field's own. A `true` property
 * holds any value, and a `false` one none, so it holds no property of the data
 */
function propertiesOf<S extends StrictRJSFSchema>(layers: readonly S[]): Map<string, S | true> {
  const properties = new Map<string, S | true>();
  for (const layer of layers) {
    for (const [key, property] of Object.entries(layer.properties ?? {})) {
      if (isSchemaObject<S>(property) || property === true) {
        properties.set(key, property);
      } else if (property === false) {
        properties.delete(key);
      }
    }
  }
  return properties;
}

/** The subschema the item at `index` is rendered with */
function itemOf<S extends StrictRJSFSchema>(layers: readonly S[], index: number): S | undefined {
  const items = keywordOf(layers, 'items');
  const item = Array.isArray(items) ? (items[index] ?? keywordOf(layers, 'additionalItems')) : items;
  return isSchemaObject<S>(item) ? item : undefined;
}

/** One field of both trees: its subschema and value on each side, and the default its parent declares for it */
interface FieldPair<S> {
  oldRaw: S | undefined;
  newRaw: S;
  oldValue: unknown;
  newValue: unknown;
  oldInherited: unknown;
  newInherited: unknown;
  /** Whether the field is an array item, whose `null` or `undefined` is a placeholder the item's schema judges */
  isItem: boolean;
  /** Whether the field was in the data before: a property holding a value, or an item of an array the data held */
  hasOld: boolean;
  /** `oldRaw` and `newRaw` retrieved for their values, when the caller has them */
  oldRetrieved?: S;
  newRetrieved?: S;
}

function walk<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  pair: FieldPair<S>,
  path: FieldPathList,
): unknown {
  const { oldRaw, newRaw, oldValue, newValue, oldInherited, newInherited, isItem, hasOld, oldRetrieved, newRetrieved } =
    pair;
  const edited = isEdited(ctx, path);
  if (oldRaw === undefined || !hasOld || (newValue === undefined && !isItem)) {
    return newValue;
  }
  // Nothing a field's subtree is built from differs, so neither does the subtree
  if (!edited && oldRaw === newRaw && oldValue === newValue && Object.is(oldInherited, newInherited)) {
    return newValue;
  }
  // The old side shows the options the new side shows from the same lists: which option the data is shown under is
  // the selection's, or the match's, and a switch's data is `formDataForNewOption()`'s, so no switch drops a value
  const shown = new Map<string, number>();
  const newLayers = layersOf(ctx, ctx.schemaUtils, newRaw, newValue, path, shown, newRetrieved);
  const oldLayers = layersOf(ctx, ctx.oldSchemaUtils, oldRaw, oldValue, path, shown, oldRetrieved);
  if (newLayers.length === 0) {
    return newValue;
  }
  const oldOwnDefault = keywordOf(oldLayers, DEFAULT_KEY);
  const newOwnDefault = keywordOf(newLayers, DEFAULT_KEY);
  const oldDefault = oldOwnDefault ?? oldInherited;
  const newDefault = newOwnDefault ?? newInherited;
  // The edited value and the values holding it are the user's
  if (!edited) {
    const judged = judge(oldLayers, newLayers, newValue, oldDefault, newDefault, isItem);
    if (judged !== undefined) {
      return judged;
    }
  }
  if (newLayers.some((layer) => isWholeValueSelect<S>(layer))) {
    return newValue;
  }
  if (isPlainObject(newValue)) {
    const oldProperties = propertiesOf(oldLayers);
    const newProperties = propertiesOf(newLayers);
    const previousKeyOf = previousKeys(ctx, path, oldValue);
    let result: Record<string, unknown> = newValue;
    for (const key of Object.keys(newValue)) {
      const childPath = [...path, key];
      const newChild = newProperties.get(key);
      const oldChild = oldProperties.get(key);
      let next: unknown = newValue[key];
      // A `true` property holds the value whatever it is, so there is nothing to judge it by
      if (newChild !== undefined && newChild !== true) {
        const previousValue = valueAt(oldValue, previousKeyOf(key));
        next = walk(
          ctx,
          {
            oldRaw: oldChild === true ? undefined : oldChild,
            newRaw: newChild,
            oldValue: previousValue,
            newValue: newValue[key],
            oldInherited: isPlainObject(oldOwnDefault) ? getByPath(oldOwnDefault, key) : undefined,
            newInherited: isPlainObject(newOwnDefault) ? getByPath(newOwnDefault, key) : undefined,
            isItem: false,
            hasOld: previousValue !== undefined,
          },
          childPath,
        );
      } else if (newChild === undefined && oldChild !== undefined && !isEdited(ctx, childPath)) {
        next = DROP;
      }
      if (next !== newValue[key]) {
        if (result === newValue) {
          result = { ...newValue };
        }
        if (next === DROP) {
          delete result[key];
        } else {
          setOwn(result, key, next);
        }
      }
    }
    return result;
  }
  if (Array.isArray(newValue)) {
    const previousKeyOf = previousKeys(ctx, path, oldValue, {
      items: newValue,
      isTuple: Array.isArray(keywordOf(newLayers, 'items')),
    });
    // Read slot by slot, so a hole a write past the array's end left keeps its place rather than being skipped
    const items = Array.from(newValue, (item: unknown, index) => {
      const newItem = itemOf(newLayers, index);
      const previousIndex = previousKeyOf(String(index));
      const hasPrevious =
        Array.isArray(oldValue) && previousIndex !== undefined && Number(previousIndex) < oldValue.length;
      // An item no previous one moved to, such as a copy or a new row, is judged as holding what it holds now under
      // the old tree's item at its index, so a change that flips the constraints of the rows judges it as it judges them
      return newItem === undefined
        ? item
        : walk(
            ctx,
            {
              oldRaw: itemOf(oldLayers, index),
              newRaw: newItem,
              oldValue: hasPrevious ? valueAt(oldValue, previousIndex) : item,
              newValue: item,
              oldInherited: undefined,
              newInherited: undefined,
              isItem: true,
              hasOld: Array.isArray(oldValue),
            },
            [...path, index],
          );
    });
    const kept = items.filter((item) => item !== DROP);
    const maxItems = keywordOf(newLayers, 'maxItems');
    const isNewBound = !edited && !deepEquals(keywordOf(oldLayers, 'maxItems'), maxItems);
    const bounded =
      isNewBound && typeof maxItems === 'number' && kept.length > maxItems ? kept.slice(0, maxItems) : kept;
    return bounded.length === newValue.length && bounded.every((item, index) => item === newValue[index])
      ? newValue
      : bounded;
  }
  return newValue;
}

/** Sanitizes `data` for the field tree it builds, against the tree `previous` built: the diff of the two trees, field
 * by field, as each is rendered (the selected option, the expanded `$ref` cycles). A field that left the tree loses its
 * value. A field whose constraints changed (`type`, `const`, `enum`, `maxItems`, or the default declared for it on its
 * own schema or on its parent's) has its value judged again, see `judge()`: a value still holding the default the old
 * schema declared takes the new one, written in place. A field whose constraints did not change keeps its value, so an
 * edit elsewhere never re-judges it. The value of the field being edited, and of the fields holding it, is the
 * user's, and only what they hold is judged. Both trees show the option the new data is shown under, so an option
 * switch, by the selector or by matching, changes no field's constraints: the data a switch sends is
 * `formDataForNewOption()`'s.
 *
 * @param previous - The previous tree: the schema utilities it is built with, its data, and the root schema retrieved
 *        for that data
 * @param next - The new tree, likewise, whose data is the data to sanitize
 * @param uiState - The form's option selections and cycle expansions
 * @param [edit] - The change being made, if any: its path, and where it moved the keys of the array or object there,
 *        so each item or property is paired with its own previous value
 * @returns - The sanitized data, sharing everything it left alone with `data`
 */
export default function sanitizeFieldTree<T, S extends StrictRJSFSchema, F extends FormContextType>(
  previous: FieldTree<T, S, F>,
  next: FieldTree<T, S, F>,
  uiState: UiState,
  edit?: FieldEdit,
): T | undefined {
  const sanitized = walk(
    {
      oldSchemaUtils: previous.schemaUtils,
      schemaUtils: next.schemaUtils,
      uiState,
      editedPath: edit?.path,
      newKeyOf: edit?.newKeyOf,
    },
    {
      oldRaw: previous.schemaUtils.getRootSchema(),
      newRaw: next.schemaUtils.getRootSchema(),
      oldValue: previous.formData,
      newValue: next.formData,
      oldInherited: undefined,
      newInherited: undefined,
      isItem: false,
      hasOld: true,
      oldRetrieved: previous.retrievedSchema,
      newRetrieved: next.retrievedSchema,
    },
    [],
  );
  return sanitized === DROP ? undefined : asFieldValue<T>(sanitized);
}
