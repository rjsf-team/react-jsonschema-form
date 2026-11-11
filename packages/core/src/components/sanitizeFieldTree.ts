import type {
  FieldPath,
  FieldPathList,
  FormContextType,
  FormFieldState,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  constrainsAlike,
  CONST_KEY,
  deepEquals,
  DEFAULT_KEY,
  expandRefCycle,
  fieldPathFromList,
  fieldPathToList,
  getByPath,
  getDiscriminatorFieldFromSchema,
  getItemSchema,
  getPrefixLength,
  getRenderedOptionSchema,
  getXxxOfOptions,
  GUESSED_TYPE_FLAG,
  hasSchemaMarker,
  isConstantOptionList,
  isObject,
  isPlainObject,
  isSchemaObject,
  isWholeValueSelect,
  rendersOwnFieldBesideOption,
  RJSF_REF_CYCLE_KEY,
  setOwn,
  toConstant,
  unsetByPath,
} from '@rjsf/utils';

import { copyAlongPath, isPathPrefix } from './dataPaths.ts';
import type { FieldEdit } from './formState.ts';
import { clearsIn, emptyValue } from './keepClears.ts';
import type { ContainerKeyMove, KeyMove } from './keyMove.ts';
import { moveOfItems } from './keyMove.ts';
import type { UiStateReader } from './uiState.ts';
import { asFieldValue, fieldStateOf, optionListKey, retrievedOptionsOf, shownOption } from './uiState.ts';

/** The data the form fills `data` with on its first render, with the schema utilities and uiSchema `tree` is built
 * with, under the options `fieldState` says its fields show
 */
export type FirstRenderFill<T, S extends StrictRJSFSchema, F extends FormContextType> = (
  tree: FieldTree<T, S, F>,
  data: T | undefined,
  fieldState: FormFieldState<S>,
) => unknown;

/** What the tree diff needs that does not change as it descends */
interface TreeContext<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The schema utilities the previous tree is built with */
  oldSchemaUtils: SchemaUtilsType<T, S, F>;
  /** The schema utilities the new tree is built with */
  schemaUtils: SchemaUtilsType<T, S, F>;
  uiState: UiStateReader;
  /** The path of the change being made, if there is one: the value there is the user's, and the selections at or
   * above it hold
   */
  editedPath?: FieldPathList;
  /** Where the change moved the keys of the array or object at `editedPath`, if it moved any */
  newKeyOf?: KeyMove;
  /** The data the previous tree is built for */
  oldData: unknown;
  /** The previous tree, which a fill of the previous data is made as */
  oldTree: FieldTree<T, S, F>;
  fillAsFirstRender: FirstRenderFill<T, S, F>;
  /** For a disabled or read-only form, the only values judged, see `JudgedClears` */
  judgedClears: JudgedClears | undefined;
  /** Where each array the walk dropped items of moved the items it kept, an inner array's before the array holding it */
  itemMoves: ContainerKeyMove[];
}

/** The values a disabled or read-only form's sanitize judges, see `sanitizeFieldTree()`: each key holding `undefined`,
 * whoever left it, and each `null` item the form recorded as a clear
 */
export interface JudgedClears {
  /** The clears the form recorded */
  recorded: ReadonlySet<FieldPath>;
  /** The path of each judged value and of each array or object holding one, so the walk skips any other subtree */
  along: ReadonlySet<FieldPath>;
}

/** The values a disabled or read-only form's sanitize of `data` judges, see `JudgedClears`
 *
 * @param data - The data to sanitize
 * @param recorded - The clears the form recorded
 * @returns - The judged values, whose `along` is empty when there is nothing to judge
 */
export function judgedClearsIn(data: unknown, recorded: ReadonlySet<FieldPath>): JudgedClears {
  const along = new Set<FieldPath>();
  const addAlong = (path: FieldPathList) => {
    // Longest first: a path already added was added with every path holding it
    for (let end = path.length; end >= 0; end -= 1) {
      const at = fieldPathFromList(path.slice(0, end));
      if (along.has(at)) {
        return;
      }
      along.add(at);
    }
  };
  for (const clear of clearsIn(data, [])) {
    if (typeof clear[clear.length - 1] === 'string') {
      addAlong(clear);
    }
  }
  for (const clear of recorded) {
    addAlong(fieldPathToList(clear));
  }
  return { recorded, along };
}

/** The options a field of the previous tree showed, by each list's `optionListKey()`, at its path in the previous data,
 * linked to those of the fields above it
 */
interface ShownAbove {
  oldPath: FieldPathList;
  shown: ReadonlyMap<string, number>;
  above: ShownAbove | undefined;
}

/** A field tree's schema utilities, its data, and the root schema they retrieve for that data */
export interface FieldTree<T, S extends StrictRJSFSchema, F extends FormContextType> {
  schemaUtils: SchemaUtilsType<T, S, F>;
  formData?: T;
  retrievedSchema: S;
  /** The uiSchema the tree is rendered with */
  uiSchema?: UiSchema<T, S, F>;
}

/** Whether `path` is the edited path or one of its ancestors */
function isEdited<T, S extends StrictRJSFSchema, F extends FormContextType>(
  { editedPath }: TreeContext<T, S, F>,
  path: FieldPathList,
): boolean {
  return editedPath !== undefined && isPathPrefix(path, editedPath);
}

/** Whether `value`, at `path`, is judged: any value is, and with `judgedClears` only a key holding `undefined`, or a
 * `null` item the form recorded as a clear, so a recorded path a later round re-indexed onto a value leaves that value
 * alone
 */
function judgesAt<T, S extends StrictRJSFSchema, F extends FormContextType>(
  { judgedClears }: TreeContext<T, S, F>,
  path: FieldPathList,
  value: unknown,
  isItem: boolean,
): boolean {
  return (
    judgedClears === undefined ||
    (value === emptyValue(isItem) && (!isItem || judgedClears.recorded.has(fieldPathFromList(path))))
  );
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

/** A value the diff removes from the data, and that `formDataForNewOption()` drops from what a switch carries */
export const DROP = Symbol('drop');

/** A value the diff leaves without a value, for the defaults to fill */
const UNSET = Symbol('unset');

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
  if (hasSchemaMarker(schema, RJSF_REF_CYCLE_KEY)) {
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

/** Whether a field is an extra key whose schema is guessed from its data, which constrains nothing */
export function isGuessed<S extends StrictRJSFSchema>(layers: readonly S[]): boolean {
  return layers.some((layer) => hasSchemaMarker(layer, GUESSED_TYPE_FLAG));
}

/** Whether a field the old tree rendered a schema for is held by the new one only as a guessed extra key. A field with
 * no old layers, a collapsed `$ref` cycle, rendered nothing to compare with
 */
function turnsGuessed<S extends StrictRJSFSchema>(oldLayers: readonly S[], newLayers: readonly S[]): boolean {
  return oldLayers.length > 0 && isGuessed(newLayers) && !isGuessed(oldLayers);
}

/** A type guessed from an extra key's data describes the data rather than the schema, so it is no type. A list is read
 * by what it names, whatever its order or repeats */
function typeOf<S extends StrictRJSFSchema>(layers: readonly S[]): unknown {
  if (isGuessed(layers)) {
    return undefined;
  }
  const type = keywordOf(layers, 'type');
  return Array.isArray(type) ? [...new Set(type.map(String))].sort() : type;
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
  if (!isConstantOptionList<S>(options)) {
    return undefined;
  }
  return options.map((option) => toConstant<S>(option));
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

/** Whether a guessed extra key's stub renders `value`: a scalar, or an object whose every key the stub takes as an
 * extra key of its own. Not an array, since the stub declares no `items`. An option switch keeps a value its old option
 * declared by the same rule, see `formDataForNewOption()`
 */
export function guessedStubRenders<S extends StrictRJSFSchema>(value: unknown, layers: readonly S[]): boolean {
  if (Array.isArray(value)) {
    return false;
  }
  if (!isPlainObject(value)) {
    return true;
  }
  const properties = propertiesOf(layers);
  return Object.keys(value).every((key) => properties.has(key));
}

/** Re-judges a value whose field's constraints changed. A cleared property is dropped, for the defaults to fill. A value
 * equal to the default the old schema declared for it is that schema's, so it becomes the new schema's default; a value
 * of another type, or one the new `const` or `enum` rejects, is replaced as `sanitizeDataForNewSchema()` replaces it,
 * or dropped. A field the new schema only holds as an extra key whose schema is guessed from its data keeps a value
 * its stub renders, see `guessedStubRenders()`, unless the value equals what the old field's defaults fill in, such as
 * its `default`, its `const` or an empty object, which no data can tell apart from a value the user chose.
 *
 * @param acceptsNull - Whether the field's new schema holds `null`, asked only of a `null` item
 * @param isFilledByOldDefaults - Whether a value is what the defaults filled the old field with, asked only of a field
 *   that turns into a guessed extra key
 * @returns - The value to hold, `DROP` to remove it, `UNSET` to leave it without a value, or `undefined` to keep it and
 *   judge what it holds
 */
function judge<S extends StrictRJSFSchema>(
  oldLayers: readonly S[],
  newLayers: readonly S[],
  value: unknown,
  oldDefault: unknown,
  newDefault: unknown,
  isItem: boolean,
  acceptsNull: () => boolean,
  isFilledByOldDefaults: (value: unknown) => boolean,
): unknown {
  const before = constraintsOf(oldLayers, oldDefault);
  const now = constraintsOf(newLayers, newDefault);
  // A guessed stub reads as having no constraints, so an old schema that only implies its type, through `items` or
  // `properties`, would compare equal to it and keep a value the stub cannot render
  const becomesGuessed = turnsGuessed(oldLayers, newLayers);
  if (!becomesGuessed && deepEquals(before, now)) {
    return undefined;
  }
  // A clear is the user's for the field as it was, so once the field changes it gives way to the new field's defaults,
  // as a field that never held a value takes them. Dropping the key ends the clear the form recorded for it, and under
  // the default merge mode, whose fill reads no recorded clear, the key holding `undefined` is what kept it empty
  if (value === undefined && !isItem) {
    return DROP;
  }
  // A cleared item is `null`, whose row stays for the new default to fill. A `null` the item holds is a value, not a clear
  if (value === null && isItem && newDefault !== undefined && !acceptsNull()) {
    return UNSET;
  }
  const isOldDefault = oldDefault !== undefined && deepEquals(oldDefault, value);
  // A guessed stub declares no `const` or `enum`, and its `default` seeds a new extra key rather than standing in for
  // the old field's, so what the old field's defaults filled in leaves with that field
  if (becomesGuessed) {
    return isOldDefault || !guessedStubRenders(value, newLayers) || isFilledByOldDefaults(value) ? DROP : undefined;
  }
  if (isOldDefault && newDefault !== undefined) {
    return deepEquals(newDefault, value) ? undefined : structuredClone(newDefault);
  }
  if (before.type !== undefined && !deepEquals(before.type, now.type)) {
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

/** The keywords that describe an array's items */
const ITEMS_KEYWORDS = ['items', 'prefixItems', 'additionalItems'];

/** The innermost layer declaring a field's items, whose `prefixItems`, `items` and `additionalItems` describe them
 * together, rather than one layer's `prefixItems` beside another's `items` */
function itemsLayerOf<S extends StrictRJSFSchema>(layers: readonly S[]): S | undefined {
  return layers.findLast((layer) => ITEMS_KEYWORDS.some((keyword) => Object.hasOwn(layer, keyword)));
}

/** The subschema the item at `index` is judged by, as `getItemSchema()` reads it: `true` where nothing constrains it,
 * and `false` where no item is allowed. `ArrayField` renders a `prefixItems` array's items with `items`, and the default
 * draft-07 validator ignores `prefixItems`, but a schema declaring it is written for a validator that reads it by
 * position, as the Ajv 2019 and 2020 classes do, so its items are judged that way, as `sanitizeDataForNewSchema()`
 * sanitizes them
 */
function itemOf<S extends StrictRJSFSchema>(itemsLayer: S | undefined, index: number): S | boolean {
  return itemsLayer ? getItemSchema<S>(itemsLayer, index) : true;
}

/** Whether both trees constrain the item `value` at a position alike, as `constrainsAlike()` reads them, its `default`
 * aside: a `default` decides no item's validity
 *
 * @param ctx - The diff's context
 * @param oldItem - The position's schema in the previous tree
 * @param newItem - The position's schema in the new tree
 * @param value - The item
 * @returns - Whether an item the new schema rejects there already failed the old one
 */
function constrainsItemAlike<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  oldItem: S,
  newItem: S,
  value: unknown,
): boolean {
  const data = asFieldValue<T>(value);
  const oldSchema = ctx.oldSchemaUtils.retrieveSchema(oldItem, data);
  const newSchema = ctx.schemaUtils.retrieveSchema(newItem, data);
  return constrainsAlike<S>(
    { ...oldSchema, default: undefined },
    { ...newSchema, default: undefined },
    undefined,
    undefined,
  );
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
  /** Where `oldValue` sits in the old data, which a move or a pairing makes another path than the field's own, and
   * undefined for a field with no value of its own there to have come from
   */
  oldPath?: FieldPathList;
  /** The options the fields above this one showed in the previous tree */
  shownAbove?: ShownAbove;
}

/** The options the previous tree showed, as a fill of the previous data reads them: the one the diff laid out the
 * judged field and each field above it with, and otherwise the form's
 */
function oldFieldStateOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  shownAbove: ShownAbove | undefined,
): FormFieldState<S> {
  const { oldSchemaUtils, uiState, editedPath } = ctx;
  const rootSchema = oldSchemaUtils.getRootSchema();
  const form = fieldStateOf(uiState, oldSchemaUtils, editedPath);
  const oldShown = new Map<string, ReadonlyMap<string, number>>();
  for (let link = shownAbove; link; link = link.above) {
    oldShown.set(fieldPathFromList(link.oldPath), link.shown);
  }
  return {
    ...form,
    selectedOption: (fieldPath, options, formData, discriminator) => {
      const list = optionListKey<S>(options, rootSchema);
      const shown = list === '' ? undefined : oldShown.get(fieldPath)?.get(list);
      return shown ?? form.selectedOption(fieldPath, options, formData, discriminator);
    },
  };
}

/** Whether `value` is what the defaults filled the old field at `oldPath` with. Two fills are asked, since neither sees
 * all of what decides it. The field's own fill starts from the option it showed and the default it or its parent
 * declares. The form's fill, made as on its first render so a `ui:initialValue` counts, starts from the root and the
 * old data without the field's value, under the options the old tree showed, and sees the uiSchema, the `required`
 * and the defaults above the field.
 *
 * A field with no old path has only its own fill: there is no old data around it for the form's to read.
 *
 * Without its value the field holds no data, so the form's fill picks its own option by its `default`, as
 * `getDefaultFormState()` does for a field with no data whatever it is told it shows, and evaluates its
 * conditions without it, as for a field the user hasn't reached. What that fills in is what the defaults would put
 * there, so it drops as a default does, even when another option or branch filled it.
 */
function isOldFill<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  oldLayers: readonly S[],
  oldDefault: unknown,
  oldPath: FieldPathList | undefined,
  shownAbove: ShownAbove | undefined,
  value: unknown,
): boolean {
  const { oldSchemaUtils } = ctx;
  const ownFill = oldLayers.reduceRight<unknown>(
    (filled, layer) => oldSchemaUtils.getDefaultFormState(layer, asFieldValue<T>(filled)),
    oldDefault,
  );
  if (deepEquals(ownFill, value)) {
    return true;
  }
  if (oldPath === undefined) {
    return false;
  }
  const withoutValue = copyAlongPath(ctx.oldData, oldPath);
  unsetByPath(withoutValue, oldPath);
  const formFill = ctx.fillAsFirstRender(ctx.oldTree, asFieldValue<T>(withoutValue), oldFieldStateOf(ctx, shownAbove));
  return deepEquals(getByPath(formFill, oldPath), value);
}

function walk<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  pair: FieldPair<S>,
  path: FieldPathList,
): unknown {
  const {
    oldRaw,
    newRaw,
    oldValue,
    newValue,
    oldInherited,
    newInherited,
    isItem,
    hasOld,
    oldRetrieved,
    newRetrieved,
    oldPath,
    shownAbove,
  } = pair;
  const { judgedClears } = ctx;
  // Only the keys holding `undefined` and the recorded clears are judged, so a subtree holding neither keeps every value
  if (judgedClears && !judgedClears.along.has(fieldPathFromList(path))) {
    return newValue;
  }
  const keepsShape = judgedClears !== undefined;
  const edited = isEdited(ctx, path);
  // A property holding `undefined` is a clear, which is judged as the field around it changes
  const isClear = newValue === undefined && !isItem;
  if (oldRaw === undefined || (isClear ? edited : !hasOld)) {
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
  const shownHere = oldPath === undefined ? shownAbove : { oldPath, shown, above: shownAbove };
  const oldOwnDefault = keywordOf(oldLayers, DEFAULT_KEY);
  const newOwnDefault = keywordOf(newLayers, DEFAULT_KEY);
  const oldDefault = oldOwnDefault ?? oldInherited;
  const newDefault = newOwnDefault ?? newInherited;
  // The edited value and the values holding it are the user's
  if (!edited && judgesAt(ctx, path, newValue, isItem)) {
    const acceptsNull = () => ctx.schemaUtils.getValidator().isValid(newRaw, null, ctx.schemaUtils.getRootSchema());
    const judged = judge(oldLayers, newLayers, newValue, oldDefault, newDefault, isItem, acceptsNull, (value) =>
      isOldFill(ctx, oldLayers, oldDefault, oldPath, shownHere, value),
    );
    if (judged !== undefined) {
      return judged === UNSET ? undefined : judged;
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
        const previousKey = previousKeyOf(key);
        const previousValue = valueAt(oldValue, previousKey);
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
            oldPath: oldPath && previousKey !== undefined ? [...oldPath, previousKey] : undefined,
            shownAbove: shownHere,
          },
          childPath,
        );
      } else if (
        newChild === undefined &&
        oldChild !== undefined &&
        !isEdited(ctx, childPath) &&
        judgesAt(ctx, childPath, newValue[key], false)
      ) {
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
    // An object kept as a guessed extra key whose keys all dropped holds what an empty one does, which is dropped
    const isEmptied = result !== newValue && Object.keys(result).length === 0;
    return isEmptied && !edited && !keepsShape && turnsGuessed(oldLayers, newLayers) ? DROP : result;
  }
  if (Array.isArray(newValue)) {
    const newItemsLayer = itemsLayerOf(newLayers);
    const oldItemsLayer = itemsLayerOf(oldLayers);
    const prefixLength = newItemsLayer ? getPrefixLength<S>(newItemsLayer) : 0;
    const maxItems = keywordOf(newLayers, 'maxItems');
    const isNewBound = !edited && !keepsShape && !deepEquals(keywordOf(oldLayers, 'maxItems'), maxItems);
    // No prefix item is dropped, so one at or past `maxItems` is past the items the array may hold. A new `maxItems`
    // cuts it off with the items after it; an unchanged one leaves the array as it is, for validation to report
    const limit = typeof maxItems === 'number' ? maxItems : Infinity;
    const bound = isNewBound ? limit : Infinity;
    // An item at a position the new schema allows none at, or a prefix item it rejects, clears the array, as
    // `sanitizeDataForNewSchema()` clears it, unless it is at or past `maxItems`, where sanitize stops
    let rejectsArray = false;
    // An item kept as it was, or an array kept or removed whole, moves none of the items inside it
    const movesBefore = ctx.itemMoves.length;
    const previousKeyOf = previousKeys(ctx, path, oldValue, { items: newValue, isTuple: prefixLength > 0 });
    // Read slot by slot, so a hole a write past the array's end left keeps its place rather than being skipped
    const items = Array.from(newValue, (item: unknown, index) => {
      // A cleared array keeps none of its items, so the rest need no walk
      if (rejectsArray) {
        return item;
      }
      const newItem = itemOf(newItemsLayer, index);
      const oldItem = itemOf(oldItemsLayer, index);
      if (newItem === false) {
        // One the old schema allowed none at too is kept for validation to report, as is one of the array being
        // edited, which is the user's, and an unfilled prefix item, which stays a hole
        rejectsArray ||=
          !keepsShape && oldItem !== false && !edited && index < limit && !(item === undefined && index < prefixLength);
        return item;
      }
      if (newItem === true) {
        return item;
      }
      const previousIndex = previousKeyOf(String(index));
      const hasPrevious =
        Array.isArray(oldValue) && previousIndex !== undefined && Number(previousIndex) < oldValue.length;
      // An item no previous one moved to, such as a copy or a new row, is judged as holding what it holds now under
      // the old tree's item at its index, so a change that flips the constraints of the rows judges it as it judges them
      const itemMovesBefore = ctx.itemMoves.length;
      const judged = walk(
        ctx,
        {
          // An old `false` allowed no item there, so it shaped none, and the item is kept as one no old schema held
          oldRaw: typeof oldItem === 'boolean' ? undefined : oldItem,
          newRaw: newItem,
          oldValue: hasPrevious ? valueAt(oldValue, previousIndex) : item,
          newValue: item,
          oldInherited: undefined,
          newInherited: undefined,
          isItem: true,
          hasOld: Array.isArray(oldValue),
          oldPath: oldPath && hasPrevious ? [...oldPath, Number(previousIndex)] : undefined,
          shownAbove: shownHere,
        },
        [...path, index],
      );
      if (judged !== DROP || index >= prefixLength) {
        return judged;
      }
      // A prefix item dropped would move the items after it into positions describing others. An unfilled one stays a
      // hole, one of the array being edited stays as the user wrote it, and one whose position both trees constrain
      // alike, its `default` aside, already failed the old schema, so each stays for validation to report, as
      // `sanitizeDataForNewSchema()` keeps it
      if (
        edited ||
        keepsShape ||
        item === undefined ||
        index >= limit ||
        (typeof oldItem === 'object' && constrainsItemAlike(ctx, oldItem, newItem, item))
      ) {
        ctx.itemMoves.splice(itemMovesBefore);
        return item;
      }
      rejectsArray = true;
      return judged;
    });
    // A cleared array is removed, or kept as it is where it is an item of another array, as `sanitizeDataForNewSchema()`
    // keeps an inner array its sanitize clears
    if (rejectsArray) {
      ctx.itemMoves.splice(movesBefore);
      return isItem ? newValue : DROP;
    }
    const kept = items.filter((item) => item !== DROP);
    const bounded = kept.length > bound ? kept.slice(0, bound) : kept;
    if (kept.length < items.length) {
      // The items after a dropped one move down, and what the form keeps by path of them moves with them
      let next = 0;
      const newIndexes = items.map((item) => {
        if (item === DROP) {
          return undefined;
        }
        next += 1;
        return next - 1;
      });
      ctx.itemMoves.push({ container: fieldPathFromList(path), newKeyOf: moveOfItems((index) => newIndexes[index]) });
    }
    return bounded.length === newValue.length && bounded.every((item, index) => item === newValue[index])
      ? newValue
      : bounded;
  }
  return newValue;
}

/** Sanitizes `data` for the field tree it builds, against the tree `previous` built: the diff of the two trees, field
 * by field, as each is rendered (the selected option, the expanded `$ref` cycles). A field that left the tree loses its
 * value, unless the object holds it as an extra key that constrains nothing and renders it. A field whose constraints
 * changed (`type`, `const`, `enum`, `maxItems`, or the default declared for it on its own schema or on its parent's)
 * has its value judged again, see `judge()`: a value still holding the default the old schema declared takes the new
 * one, written in place. A field whose constraints did not change keeps its value, so an edit elsewhere never re-judges
 * it. The value of the field being edited, and of the fields holding it, is the user's, and only what they hold is
 * judged. Both trees show the option the new data is shown under, so an option switch, by the selector or by matching,
 * changes no field's constraints: the data a switch sends is `formDataForNewOption()`'s. With `judgedClears`, as for a
 * disabled or read-only form, only the keys holding `undefined` and the `null` items the form recorded as clears are
 * judged, by the same rule, so each gives way where it would in an enabled form and every value the data holds, a `null`
 * item the user didn't clear included, stays as it is. Dropping an item moves the items after it down, which the result
 * reports, so the recorded clears stay on their items.
 *
 * @param previous - The previous tree: the schema utilities it is built with, its data, and the root schema retrieved
 *        for that data
 * @param next - The new tree, likewise, whose data is the data to sanitize
 * @param uiState - The form's option selections and cycle expansions
 * @param fillAsFirstRender - How the form fills data on its first render, which a field's defaults are judged by
 * @param [edit] - The change being made, if any: its path, and where it moved the keys of the array or object there,
 *        so each item or property is paired with its own previous value
 * @param [judgedClears] - For a disabled or read-only form, the only values judged, see `judgedClearsIn()`
 * @returns - The sanitized data, sharing everything it left alone with `data`, and where each array it dropped items of
 *   moved the rest, an inner array's first, with the paths of the arrays holding it as they were before
 */
export default function sanitizeFieldTree<T, S extends StrictRJSFSchema, F extends FormContextType>(
  previous: FieldTree<T, S, F>,
  next: FieldTree<T, S, F>,
  uiState: UiStateReader,
  fillAsFirstRender: FirstRenderFill<T, S, F>,
  edit?: FieldEdit,
  judgedClears?: JudgedClears,
): { formData: T | undefined; itemMoves: ContainerKeyMove[] } {
  const itemMoves: ContainerKeyMove[] = [];
  const sanitized = walk(
    {
      oldSchemaUtils: previous.schemaUtils,
      schemaUtils: next.schemaUtils,
      uiState,
      editedPath: edit?.path,
      newKeyOf: edit?.newKeyOf,
      oldData: previous.formData,
      oldTree: previous,
      fillAsFirstRender,
      judgedClears,
      itemMoves,
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
      oldPath: [],
      oldRetrieved: previous.retrievedSchema,
      newRetrieved: next.retrievedSchema,
    },
    [],
  );
  return { formData: sanitized === DROP ? undefined : asFieldValue<T>(sanitized), itemMoves };
}
