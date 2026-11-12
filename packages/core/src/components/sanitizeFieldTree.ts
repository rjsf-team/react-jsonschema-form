import type {
  FieldPath,
  FieldPathList,
  FormContextType,
  FormFieldState,
  GenericObjectType,
  PropertyPlacement,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  ANY_OF_KEY,
  CONST_KEY,
  constrainsAlikeAsideDefault,
  deepEquals,
  DEFAULT_KEY,
  expandRefCycle,
  fieldPathFromList,
  fieldPathToList,
  getByPath,
  getDiscriminatorFieldFromSchema,
  getItemSchema,
  getOptionUiSchema,
  getPrefixLength,
  getRenderedOptionSchema,
  getSchemaType,
  getStaticItemsUiSchema,
  getXxxOfOptions,
  GUESSED_TYPE_FLAG,
  hasSchemaMarker,
  isConstantOptionList,
  isObject,
  isPlainObject,
  isSchemaObject,
  isWholeValueSelect,
  mergeSchemas,
  namesEveryType,
  ONE_OF_KEY,
  rendersOwnFieldBesideOption,
  resolveUiSchema,
  RJSF_REF_CYCLE_KEY,
  setOwn,
  toConstant,
  UI_DEFINITIONS_KEY,
  unsetByPath,
} from '@rjsf/utils';

import { copyAlongPath, isPathPrefix } from './dataPaths.ts';
import type { FieldEdit, SwitchedFrom } from './formState.ts';
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

/** Where a value in the data came from: a person `'entered'` it, the defaults `'filled'` it in, or a seed held it, which
 * says nothing of which of the two it was
 */
export type ValueOrigin = 'entered' | 'filled' | 'seeded';

/** The paths of the values a person entered and of those a seed held, in the data a tree is built for. A value at
 * neither is one the defaults filled in
 */
export interface DataOrigins {
  entered: ReadonlySet<FieldPath>;
  seeded: ReadonlySet<FieldPath>;
}

/** What the tree diff needs that does not change as it descends */
interface TreeContext<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The schema utilities the previous tree is built with */
  oldSchemaUtils: SchemaUtilsType<T, S, F>;
  /** The schema utilities the new tree is built with */
  schemaUtils: SchemaUtilsType<T, S, F>;
  uiState: UiStateReader;
  /** The selections and expansions the previous tree is read with: `uiState`, except below a key an option switch
   * put back, which is read as the form showed it before the switch
   */
  oldUiState: UiStateReader;
  /** The path of the change being made, if there is one: the value there is the user's, and the selections at or
   * above it hold
   */
  editedPath?: FieldPathList;
  /** Where the change moved the keys of the array or object at `editedPath`, if it moved any */
  newKeyOf?: KeyMove;
  /** For an option switch, the switched field, the option switched away from and the keys the switch put back */
  switchedFrom?: SwitchedFrom;
  /** The path, in the data the previous tree is built for, of each value a person entered and of each array or object
   * holding one, and the same for each value a seed held
   */
  enteredAlong: ReadonlySet<FieldPath>;
  seededAlong: ReadonlySet<FieldPath>;
  /** The data the previous tree is built for */
  oldData: unknown;
  /** The previous tree, which a fill of the previous data is made as */
  oldTree: FieldTree<T, S, F>;
  fillAsFirstRender: FirstRenderFill<T, S, F>;
  /** For a disabled or read-only form, the only values judged, see `JudgedClears` */
  judgedClears: JudgedClears | undefined;
  /** Where each array the walk dropped items of moved the items it kept, an inner array's before the array holding it */
  itemMoves: ContainerKeyMove[];
  /** Whether the settings the defaults are computed by changed, so a field whose schema and value didn't can still be
   * filled with another default, and none is skipped
   */
  isDefaultsChanged: boolean;
  /** Below a key a switch put back, the uiSchemas the option switched to renders the switched field's keys from, and
   * the depth of that field's path
   */
  switchedToUiSchemas?: { depth: number; uiSchemas: GenericObjectType[] };
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
  for (const clear of clearsIn(data, [])) {
    if (typeof clear[clear.length - 1] === 'string') {
      addAlong(along, clear);
    }
  }
  for (const clear of recorded) {
    addAlong(along, fieldPathToList(clear));
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

/** A value the diff removes from the data */
const DROP = Symbol('drop');

/** A value the diff leaves without a value, for the defaults to fill */
const UNSET = Symbol('unset');

/** The schemas a field renders, outermost first: the field's own, and the selected option's where it has options, which
 * renders at the same path, and so on for an option's own options. None for a collapsed `$ref` cycle that is not
 * expanded, which renders no field beneath its Expand button. Follows `SchemaField`, `MultiSchemaField` and
 * `CyclicSchemaField` as far as the schema decides them: no `uiSchema` is read, so a field whose `uiSchema` keeps its
 * options from rendering, as `ui:fieldReplacesAnyOrOneOf` does, is still taken to show one. `retrieved` is `raw` retrieved for `value`, when
 * the caller has it. `shown` maps each option list, by `optionListKey()`, to the option shown from it: an entry is
 * taken in place of the selection `uiState` holds, and a list without one is added with the option shown for `value`.
 */
function layersOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  schemaUtils: SchemaUtilsType<T, S, F>,
  uiState: UiStateReader,
  raw: S,
  value: unknown,
  path: FieldPathList,
  shown: Map<string, number>,
  retrieved?: S,
): S[] {
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
  const own = rendersOwnFieldBesideOption<S>(view, options[index])
    ? schemaUtils.retrieveSchema(schema, data, false, index)
    : view;
  const optionSchema = getRenderedOptionSchema<S>(view, options[index]);
  return [own, ...layersOf(ctx, schemaUtils, uiState, optionSchema, value, path, shown)];
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
function isGuessed<S extends StrictRJSFSchema>(layers: readonly S[]): boolean {
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

/** Whether the defaults fill a field's object key by key, as `sanitizeDataForNewSchema()` reads it: the field's own
 * `type` read as `getSchemaType()` reads it, so a type list renders as the type it names first, or, for an untyped item
 * alone, whether it or its option declares `properties` other than the stubs `retrieveSchema()` adds for the data's
 * extra keys */
function fillsKeyByKey<S extends StrictRJSFSchema>(layers: readonly S[], isItem: boolean): boolean {
  const [own] = layers;
  if (own.type !== undefined) {
    return getSchemaType<S>(own) === 'object';
  }
  return (
    isItem &&
    [...propertiesOf(layers).values()].some((property) => !hasSchemaMarker(property, ADDITIONAL_PROPERTY_FLAG))
  );
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
 * extra key of its own. Not an array, since the stub declares no `items`
 */
function guessedStubRenders<S extends StrictRJSFSchema>(value: unknown, layers: readonly S[]): boolean {
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
 * equal to the default the old schema filled it with is that schema's, so it becomes the new schema's default; a value
 * of another type, or one the new `const` or `enum` rejects, is replaced as `sanitizeDataForNewSchema()` replaces it,
 * or dropped. A field the new schema only holds as an extra key whose schema is guessed from its data keeps a value
 * its stub renders, see `guessedStubRenders()`, unless the value equals what the old field's defaults fill in, such as
 * its `default`, its `const` or an empty object, which no data can tell apart from a value the user chose.
 *
 * @param acceptsNull - Whether the field's new schema holds `null`, asked only of a `null` item
 * @param origin - Where the value came from. One a person entered is theirs whatever it equals, and one the defaults
 *   filled in is the old field's. One a seed held is compared with what the defaults give, since nothing else tells
 * @param isFilledByOldDefaults - Whether a value is what the defaults filled the old field with, asked only of a
 *   seeded value of a field that turns into a guessed extra key
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
  origin: ValueOrigin,
  isFilledByOldDefaults: (value: unknown) => boolean,
  oldFillOut: (value: unknown) => unknown,
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
  const isOldDefault = origin !== 'entered' && oldDefault !== undefined && deepEquals(oldDefault, value);
  // A guessed stub declares no `const` or `enum`, and its `default` seeds a new extra key rather than standing in for
  // the old field's, so what the old field's defaults filled in leaves with that field
  if (becomesGuessed) {
    const isFilled = origin === 'filled' || (origin === 'seeded' && isFilledByOldDefaults(value));
    return isOldDefault || !guessedStubRenders(value, newLayers) || isFilled ? DROP : undefined;
  }
  // An object the defaults fill key by key holds its old default only as far as each key does, since the fill can leave
  // some of the default's keys out, so its properties are judged one by one, as `sanitizeDataForNewSchema()` does
  const isFilledByKey = () =>
    isPlainObject(value) &&
    isPlainObject(newDefault) &&
    !newLayers.some((layer) => isWholeValueSelect<S>(layer)) &&
    fillsKeyByKey(newLayers, isItem);
  // A value equal to the new default is still judged by the rest, since a new `const` or `enum` can reject it. What the
  // old field's defaults filled out from the `default` it declared, to `minItems` or below it through a
  // `ui:initialValue`, is theirs too, though not what they compute for a field declaring none, as a required boolean's
  // `false`, nor what its own `ui:initialValue` replaced the default with
  const isNewDefault = newDefault === undefined || deepEquals(newDefault, value);
  if (!isNewDefault && !isFilledByKey()) {
    // A value holding the old default takes the new one as it is, but an array, which the fill fills out from it to
    // `minItems` and below its items, is filled out from it as what the old default filled out is: in place, as a
    // fresh mount fills it, or dropped for the fill. One that comes back as it is is kept, and judged by the rest
    if (isOldDefault && !Array.isArray(value)) {
      return structuredClone(newDefault);
    }
    const filledOut = oldDefault === undefined ? undefined : oldFillOut(value);
    if (filledOut === DROP) {
      return isItem ? UNSET : DROP;
    }
    if (filledOut !== undefined && !deepEquals(filledOut, value)) {
      return filledOut;
    }
  }
  // A `readOnly` property shows the default it is filled with, which the user can't change there, so another value
  // gives way to a new one replacing an old one, as `sanitizeDataForNewSchema()` clears it: read from the field's own
  // schema, for a scalar or a select's whole value. Where the old field declared none, the value is saved data
  const isWholeValue =
    typeof value !== 'object' || value === null || newLayers.some((layer) => isWholeValueSelect<S>(layer));
  if (
    !isNewDefault &&
    !isItem &&
    oldDefault !== undefined &&
    !deepEquals(oldDefault, newDefault) &&
    isWholeValue &&
    newLayers[0].readOnly === true
  ) {
    return DROP;
  }
  // An item is rejected by its type only where the new schema declares one that leaves out an old type, as
  // `sanitizeDataForNewSchema()` reads it, since dropping a prefix item clears its array
  const isTypeChange = isItem
    ? now.type !== undefined && !namesEveryType(before.type, now.type)
    : !deepEquals(before.type, now.type);
  if (before.type !== undefined && isTypeChange) {
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

/** The schema of a field that constrains nothing: an item at a position the old schema declared `true` or `false` at,
 * or a property either tree declares `true` */
const UNCONSTRAINED = {};

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

/** Whether both trees constrain the item `value` at a position alike, as `constrainsAlikeAsideDefault()` reads them:
 * a `default` decides no item's validity
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
  return constrainsAlikeAsideDefault<S>(oldSchema, newSchema);
}

/** One field of both trees: its subschema and value on each side, and the default its parent is filled with for it */
interface FieldPair<S> {
  oldRaw: S | undefined;
  newRaw: S;
  oldValue: unknown;
  newValue: unknown;
  oldInherited: unknown;
  newInherited: unknown;
  /** Whether the defaults read the field as required on each side, as they hand it `required`: a property its object
   * lists in `required`, or an item whose array is required. Undefined for the root
   */
  oldRequired?: boolean;
  newRequired?: boolean;
  /** For a property, whether the defaults read the object holding it as required on each side */
  oldParentRequired?: boolean;
  newParentRequired?: boolean;
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
  /** The uiSchema the previous tree renders `oldValue` with, where no other can, see `soleUiSchemaOf()` */
  oldUiSchema?: GenericObjectType;
}

/** The options the previous tree showed, as a fill of the previous data reads them: the one the diff laid out the
 * judged field and each field above it with, and otherwise the form's
 */
function oldFieldStateOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  shownAbove: ShownAbove | undefined,
): FormFieldState<S> {
  const { oldSchemaUtils, oldUiState, editedPath } = ctx;
  const rootSchema = oldSchemaUtils.getRootSchema();
  const form = fieldStateOf(oldUiState, oldSchemaUtils, editedPath);
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
 * all of what decides it. The field's own fill starts from the option it showed and the default the defaults fill it
 * with. The form's fill, made as on its first render so a `ui:initialValue` counts, starts from the root and the
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
  if (isOwnFill(ctx.oldSchemaUtils, oldLayers, oldDefault, value)) {
    return true;
  }
  if (oldPath === undefined) {
    return false;
  }
  const withoutValue = copyAlongPath(ctx.oldData, oldPath);
  const holder: unknown = oldPath.length === 1 ? withoutValue : getByPath(withoutValue, oldPath.slice(0, -1));
  // The fill fills an `undefined` item but skips a hole, which deleting it would leave
  if (Array.isArray(holder)) {
    holder[Number(oldPath[oldPath.length - 1])] = undefined;
  } else {
    unsetByPath(withoutValue, oldPath);
  }
  const formFill = ctx.fillAsFirstRender(ctx.oldTree, asFieldValue<T>(withoutValue), oldFieldStateOf(ctx, shownAbove));
  return deepEquals(getByPath(formFill, oldPath), value);
}

/** Adds `path` to `along` with the path of every array and object holding it, the root's included */
function addAlong(along: Set<FieldPath>, path: FieldPathList): void {
  // Longest first: a path already added was added with every path holding it
  for (let end = path.length; end >= 0; end -= 1) {
    const at = fieldPathFromList(path.slice(0, end));
    if (along.has(at)) {
      return;
    }
    along.add(at);
  }
}

/** Each of `paths` with the path of every array and object holding it, the root's included */
function pathsAlong(paths: ReadonlySet<FieldPath>): ReadonlySet<FieldPath> {
  const along = new Set<FieldPath>();
  paths.forEach((path) => addAlong(along, fieldPathToList(path)));
  return along;
}

/** Where the value at `oldPath` of the previous data came from, an array or object taking the origin of what it holds:
 * entered if a person entered any of it, or else seeded if a seed held any of it. A value with no place in the
 * previous data is one the change itself wrote
 */
function originOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  oldPath: FieldPathList | undefined,
): ValueOrigin {
  if (oldPath === undefined) {
    return 'entered';
  }
  const at = fieldPathFromList(oldPath);
  if (ctx.enteredAlong.has(at)) {
    return 'entered';
  }
  return ctx.seededAlong.has(at) ? 'seeded' : 'filled';
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
    oldRequired,
    newRequired,
    oldParentRequired,
    newParentRequired,
    isItem,
    hasOld,
    oldRetrieved,
    newRetrieved,
    oldPath,
    shownAbove,
    oldUiSchema,
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
  if (
    !edited &&
    !ctx.isDefaultsChanged &&
    oldRaw === newRaw &&
    oldValue === newValue &&
    oldRequired === newRequired &&
    oldParentRequired === newParentRequired &&
    deepEquals(oldInherited, newInherited)
  ) {
    return newValue;
  }
  // The old side shows the options the new side shows from the same lists: which option the data is shown under is
  // the selection's, or the match's, so a matching change changes no field's constraints. The keys a switch put back
  // are the exception: they are laid out on the old side under the option switched away from, and below them as the
  // form showed them before the switch, so each is judged against the fields that option rendered, as a field a
  // conditional changes is
  const shown = new Map<string, number>();
  const newLayers = layersOf(ctx, ctx.schemaUtils, ctx.uiState, newRaw, newValue, path, shown, newRetrieved);
  const oldLayers = layersOf(ctx, ctx.oldSchemaUtils, ctx.oldUiState, oldRaw, oldValue, path, shown, oldRetrieved);
  if (newLayers.length === 0) {
    return newValue;
  }
  const shownHere = oldPath === undefined ? shownAbove : { oldPath, shown, above: shownAbove };
  const { switchedFrom } = ctx;
  const isSwitched =
    switchedFrom !== undefined && path.length === switchedFrom.path.length && isPathPrefix(path, switchedFrom.path);
  // A property's value is judged by the default the defaults write into it, while what it hands its own properties is
  // the default it computes, which they fill from whether or not it is written itself
  const isProperty = !isItem && path.length > 0;
  // Read only by the judge of an item or the root, and by the properties of an object, so a property holding no
  // object, whose value is judged by its written default, runs no option pick for it
  const isComputedRead = !isProperty || isPlainObject(newValue);
  const oldComputed = isComputedRead ? filledDefaultOf(ctx.oldSchemaUtils, oldLayers, oldInherited) : undefined;
  const newComputed = isComputedRead ? filledDefaultOf(ctx.schemaUtils, newLayers, newInherited) : undefined;
  // The edited value and the values holding it are the user's
  if (!edited && judgesAt(ctx, path, newValue, isItem)) {
    // The fill picks the option of a field holding no data by the field's own `default`, not by the one `Form` shows,
    // and writes that option's `default`, so a clear hands `getFilledDefault()` the field's own layer, options and all,
    // for it to pick as the fill does
    const filledLayers = (layers: S[]) => (isClear ? layers.slice(0, 1) : layers);
    const oldDefault = isProperty
      ? filledDefaultOf(ctx.oldSchemaUtils, filledLayers(oldLayers), oldInherited, {
          isRequired: oldRequired,
          isParentRequired: oldParentRequired,
        })
      : oldComputed;
    const newDefault = isProperty
      ? filledDefaultOf(ctx.schemaUtils, filledLayers(newLayers), newInherited, {
          isRequired: newRequired,
          isParentRequired: newParentRequired,
        })
      : newComputed;
    const acceptsNull = () => ctx.schemaUtils.getValidator().isValid(newRaw, null, ctx.schemaUtils.getRootSchema());
    const judged = judge(
      oldLayers,
      newLayers,
      newValue,
      oldDefault,
      newDefault,
      isItem,
      acceptsNull,
      originOf(ctx, oldPath),
      (value) => isOldFill(ctx, oldLayers, oldDefault, oldPath, shownHere, value),
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
    const oldRequiredKeys = requiredOf(oldLayers);
    const newRequiredKeys = requiredOf(newLayers);
    // The keys a switch put back are judged under the option switched away from
    let heldSide:
      | {
          keys: ReadonlySet<string>;
          properties: Map<string, S | true>;
          required: Set<string> | undefined;
          computedDefault: unknown;
          shownHere?: ShownAbove;
          ctx: TreeContext<T, S, F>;
          optionUiSchema?: GenericObjectType;
        }
      | undefined;
    if (isSwitched && switchedFrom.heldKeys.size > 0) {
      // The option switched to renders the keys with its own entry of the switched field's uiSchema option list where
      // that list holds one, and with the field's uiSchema otherwise, as `getOptionUiSchema()` picks it, so a key is
      // filled out anew under the uiSchema that option renders it with
      const newOptions = retrievedOptionsOf<T, S, F>(ctx.schemaUtils, newLayers[0], asFieldValue<T>(newValue));
      const newIndex = newOptions
        ? shown.get(optionListKey<S>(newOptions, ctx.schemaUtils.getRootSchema()))
        : undefined;
      const xxxOfKey = getXxxOfOptions<S>(newLayers[0])?.key;
      const ownUiSchemas = (
        oldUiSchema
          ? [oldUiSchema]
          : uiSchemasOn(ctx, path.slice(0, -1)).flatMap((uiSchema) =>
              uiSchemasAt(uiSchema, path[path.length - 1], true),
            )
      ).filter((uiSchema): uiSchema is GenericObjectType => isObject(uiSchema));
      const switchedTo = ownUiSchemas.flatMap((uiSchema) => {
        const optionUiSchema =
          xxxOfKey && newIndex !== undefined ? getOptionUiSchema(uiSchema, xxxOfKey, newIndex) : uiSchema;
        return optionUiSchema === uiSchema ? [uiSchema] : withOptionUiSchemas([optionUiSchema]);
      });
      // The form as it was before the switch: its selections, with the option switched away from at the switched field,
      // which holds there and above it as for an edit made there, so the fill of the old data reads it too. Every list
      // at the path is read from them afresh, since `shown` holds the options the new side shows
      const heldCtx: TreeContext<T, S, F> = {
        ...ctx,
        oldUiState: switchedFrom.uiState,
        newKeyOf: undefined,
        switchedFrom: undefined,
        switchedToUiSchemas: { depth: path.length, uiSchemas: switchedTo },
      };
      const heldShown = new Map<string, number>();
      const heldLayers = layersOf(
        heldCtx,
        ctx.oldSchemaUtils,
        switchedFrom.uiState,
        oldRaw,
        oldValue,
        path,
        heldShown,
        oldRetrieved,
      );
      heldSide = {
        keys: switchedFrom.heldKeys,
        properties: propertiesOf(heldLayers),
        required: requiredOf(heldLayers),
        computedDefault: filledDefaultOf(ctx.oldSchemaUtils, heldLayers, oldInherited),
        shownHere: oldPath === undefined ? shownAbove : { oldPath, shown: heldShown, above: shownAbove },
        ctx: heldCtx,
        optionUiSchema: shownOptionUiSchemaOf<T, S, F>(
          ctx.oldSchemaUtils,
          heldLayers,
          oldValue,
          heldShown,
          oldUiSchema,
        ),
      };
    }
    const oldOptionUiSchema = shownOptionUiSchemaOf<T, S, F>(
      ctx.oldSchemaUtils,
      oldLayers,
      oldValue,
      shown,
      oldUiSchema,
    );
    let result: Record<string, unknown> = newValue;
    for (const key of Object.keys(newValue)) {
      const childPath = [...path, key];
      const newChild = newProperties.get(key);
      const from = heldSide?.keys.has(key) ? heldSide : undefined;
      const oldChild = (from?.properties ?? oldProperties).get(key);
      let next: unknown = newValue[key];
      // A `true` property holds the value whatever it is, so it constrains nothing on either side: a value the new one
      // holds is judged by its default alone, and one an old `true` held by what the new schema declares
      const newSchema = newChild === true ? (UNCONSTRAINED as S) : newChild;
      const isOldUnconstrained = oldChild === true || (newChild === true && oldChild !== undefined);
      const oldSchema = isOldUnconstrained ? (UNCONSTRAINED as S) : oldChild;
      if (newSchema !== undefined) {
        const previousKey = from ? key : previousKeyOf(key);
        const previousValue = valueAt(oldValue, previousKey);
        const oldParentDefault = from ? from.computedDefault : oldComputed;
        next = walk(
          from?.ctx ?? ctx,
          {
            oldRaw: oldSchema,
            newRaw: newSchema,
            oldValue: previousValue,
            newValue: newValue[key],
            oldInherited: isPlainObject(oldParentDefault) ? getByPath(oldParentDefault, key) : undefined,
            newInherited: isPlainObject(newComputed) ? getByPath(newComputed, key) : undefined,
            oldRequired: (from ? from.required : oldRequiredKeys)?.has(key),
            newRequired: newRequiredKeys?.has(key),
            oldParentRequired: oldRequired,
            newParentRequired: newRequired,
            isItem: false,
            hasOld: previousValue !== undefined,
            oldPath: oldPath && previousKey !== undefined ? [...oldPath, previousKey] : undefined,
            shownAbove: from ? from.shownHere : shownHere,
            // An extra key renders with the `additionalProperties` uiSchema, whatever entry its name has
            oldUiSchema:
              previousKey === undefined || hasSchemaMarker(oldChild, ADDITIONAL_PROPERTY_FLAG)
                ? undefined
                : soleUiSchemaOf(
                    ctx,
                    (from ? from.optionUiSchema : oldOptionUiSchema) ?? oldUiSchema,
                    oldChild,
                    (uiSchema) => uiSchema[previousKey],
                  ),
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
    const oldTupleLength = Array.isArray(oldItemsLayer?.items) ? oldItemsLayer.items.length : Infinity;
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
          // An old `true` or `false` constrained no item there, so the item is judged by the new schema alone, as
          // `sanitizeDataForNewSchema()` judges it
          oldRaw: typeof oldItem === 'boolean' ? (UNCONSTRAINED as S) : oldItem,
          newRaw: newItem,
          oldValue: hasPrevious ? valueAt(oldValue, previousIndex) : item,
          newValue: item,
          oldInherited: undefined,
          newInherited: undefined,
          oldRequired,
          newRequired,
          isItem: true,
          hasOld: Array.isArray(oldValue),
          oldPath: oldPath && hasPrevious ? [...oldPath, Number(previousIndex)] : undefined,
          shownAbove: shownHere,
          // Past a tuple an item renders with the `additionalItems` uiSchema, as `ArrayField` reads it, and a function
          // `items` is no entry to read
          oldUiSchema: hasPrevious
            ? soleUiSchemaOf(ctx, oldUiSchema, oldItem, (uiSchema) => {
                const at = Number(previousIndex);
                if (at >= oldTupleLength) {
                  return uiSchema.additionalItems;
                }
                return Array.isArray(uiSchema.items) ? uiSchema.items[at] : uiSchema.items;
              })
            : undefined,
        },
        [...path, index],
      );
      if (judged !== DROP || index >= prefixLength) {
        return judged;
      }
      // A prefix item dropped would move the items after it into positions describing others. An unfilled one stays a
      // hole, one of the array being edited stays as the user wrote it, and one whose position both trees constrain
      // alike, the defaults aside, already failed the old schema, so each stays for validation to report, as
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

/** The uiSchemas the old uiSchema can render the field at `path` with, walking only those along `path` and
 * over-counting them rather than resolving which one renders: every option's, an array's `items` and `additionalItems`
 * alike. Read only where `soleUiSchemaOf()` can't tell the field's own. shortcut: one a `ui:definitions` entry of an
 * ancestor's `$ref` holds is missed, so a value it filled out isn't dropped whole but judged key by key, keeping what
 * the `ui:initialValue` filled in; upgrade once the diff carries each field's resolved uiSchema
 */
function uiSchemasOn<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  path: FieldPathList,
): GenericObjectType[] {
  return uiSchemasBelow(withOptionUiSchemas([ctx.oldTree.uiSchema]), path);
}

/** The uiSchemas the fill can render the value at `path` below a field rendered with `uiSchemas` with, as
 * `uiSchemasOn()` walks them, or with `isOwn` leaving out `additionalProperties`, see `uiSchemasAt()` */
function uiSchemasBelow(uiSchemas: GenericObjectType[], path: FieldPathList, isOwn = false): GenericObjectType[] {
  return path.reduce(
    (reached, key) => withOptionUiSchemas(reached.flatMap((uiSchema) => uiSchemasAt(uiSchema, key, isOwn))),
    uiSchemas,
  );
}

/** The uiSchemas the fill can render the value at `key` of a field rendered with `uiSchema` with, or with `isOwn` only
 * the one a declared `key` names. An item keeps its `additionalItems` one, which is its own past a tuple */
function uiSchemasAt(uiSchema: GenericObjectType, key: string | number, isOwn = false): unknown[] {
  if (typeof key === 'number') {
    return [getStaticItemsUiSchema(uiSchema, key), uiSchema.additionalItems];
  }
  return isOwn ? [uiSchema[key]] : [uiSchema[key], uiSchema.additionalProperties];
}

/** The uiSchema the previous tree renders the field `raw` describes with, the entry `entry` reads from the one it
 * renders the field holding it with, `uiSchema`, resolved as the field resolves it: an entry the field has none of is
 * `{}`, and a `ui:definitions` one its `$ref` names is merged beneath it. `undefined` where `uiSchema` is unknown, or
 * offers `anyOf`/`oneOf` ones that could render the field instead, or the entry is no uiSchema, as a function `items`
 */
function soleUiSchemaOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: TreeContext<T, S, F>,
  uiSchema: GenericObjectType | undefined,
  raw: S | boolean | undefined,
  entry: (uiSchema: GenericObjectType) => unknown,
): GenericObjectType | undefined {
  if (!uiSchema || ANY_OF_KEY in uiSchema || ONE_OF_KEY in uiSchema) {
    return undefined;
  }
  const reached = entry(uiSchema);
  if (reached !== undefined && !isObject(reached)) {
    return undefined;
  }
  return resolveUiSchema<T, S, F>((isObject(raw) ? raw : {}) as S, reached as UiSchema<T, S, F> | undefined, {
    rootSchema: ctx.oldSchemaUtils.getRootSchema(),
    uiSchemaDefinitions: ctx.oldTree.uiSchema?.[UI_DEFINITIONS_KEY],
  });
}

/** Where `uiSchema`, the one the field with `layers` renders with, offers `anyOf`/`oneOf` ones, the one its shown
 * option renders every key of the field with, as `getOptionUiSchema()` picks it, so the field's own entry for a key is
 * never read, whether the field or the option declares it. shortcut: only one option level is read, since `shown` keys
 * inline lists alike; upgrade once the layers carry the option each one shows
 */
function shownOptionUiSchemaOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  layers: readonly S[],
  value: unknown,
  shown: ReadonlyMap<string, number>,
  uiSchema: GenericObjectType | undefined,
): GenericObjectType | undefined {
  const keyword = getXxxOfOptions<S>(layers[0])?.key;
  if (!uiSchema || !keyword || !(keyword in uiSchema) || layers.length !== 2) {
    return undefined;
  }
  const options = retrievedOptionsOf<T, S, F>(schemaUtils, layers[0], asFieldValue<T>(value));
  const index = options ? shown.get(optionListKey<S>(options, schemaUtils.getRootSchema())) : undefined;
  if (index === undefined) {
    return undefined;
  }
  // An option the list holds no entry for renders with the field's uiSchema, whose list it doesn't read, and one whose
  // entry is no uiSchema renders with none
  const optionUiSchema = getOptionUiSchema(uiSchema, keyword, index);
  if (optionUiSchema === uiSchema) {
    const { [keyword]: _options, ...fieldUiSchema } = uiSchema;
    return fieldUiSchema;
  }
  return isObject(optionUiSchema) ? optionUiSchema : {};
}

/** `uiSchemas` that are objects, in order, then the uiSchemas their `anyOf`/`oneOf` options hold, theirs included, so a
 * field's own uiSchema comes before its `additionalProperties` or `additionalItems` one
 */
function withOptionUiSchemas(uiSchemas: unknown[]): GenericObjectType[] {
  const found: GenericObjectType[] = [];
  const pending = [...uiSchemas];
  while (pending.length > 0) {
    const uiSchema = pending.shift();
    if (isObject(uiSchema) && !found.includes(uiSchema)) {
      found.push(uiSchema);
      for (const options of [uiSchema[ANY_OF_KEY], uiSchema[ONE_OF_KEY]]) {
        if (Array.isArray(options)) {
          pending.push(...options);
        }
      }
    }
  }
  return found;
}

/** Sanitizes `data` for the field tree it builds, against the tree `previous` built: the diff of the two trees, field by
 * field, as each is rendered (the selected option, the expanded `$ref` cycles). A field that left the tree loses its
 * value, unless the object holds it as an extra key that constrains nothing and renders it. A field whose constraints
 * changed (`type`, `const`, `enum`, `maxItems`, or the default the defaults fill it with, see `getFilledDefault()`) has
 * its value judged again, see `judge()`: a value still holding the default the old schema filled it with takes the new
 * one, written in place, an array filled out as a fresh mount fills it. A field whose constraints did not change keeps
 * its value, so an edit elsewhere never re-judges it. The value of the field being edited, and of the fields holding
 * it, is the user's, and only what they hold is judged. Both trees show the option the new data is shown under, so an
 * option matched anew changes no field's constraints. A switch by the selector puts back each key the data held before
 * it, as it held it, and each is judged against the option switched away from, as a field a conditional changes is, so
 * the defaults and clears of the keys both options declare are read from the fills the diff holds at that path. With
 * `judgedClears`, as for a disabled or read-only form, only the keys holding `undefined` and the `null` items the form
 * recorded as clears are judged, by the same rule, so each gives way where it would in an enabled form and every value
 * the data holds, a `null` item the user didn't clear included, stays as it is. Dropping an item moves the items after
 * it down, which the result reports, so the recorded clears stay on their items.
 *
 * @param previous - The previous tree: the schema utilities it is built with, its data, and the root schema retrieved
 *        for that data
 * @param next - The new tree, likewise, whose data is the data to sanitize
 * @param uiState - The form's option selections and cycle expansions
 * @param fillAsFirstRender - How the form fills data on its first render, which a seeded value is judged by
 * @param origins - Where the values of the data of `previous` came from
 * @param [edit] - The change being made, if any: its path, where it moved the keys of the array or object there, so
 *        each item or property is paired with its own previous value, and the option a switch there left with the keys
 *        it put back
 * @param [judgedClears] - For a disabled or read-only form, the only values judged, see `judgedClearsIn()`
 * @param [isDefaultsChanged=false] - Whether the `defaultFormStateBehavior` the defaults are computed by changed since
 *        `previous`, so every field is judged again, however little its schema and value changed
 * @returns - The sanitized data, sharing everything it left alone with `data`, and where each array it dropped items of
 *   moved the rest, an inner array's first, with the paths of the arrays holding it as they were before
 */
export default function sanitizeFieldTree<T, S extends StrictRJSFSchema, F extends FormContextType>(
  previous: FieldTree<T, S, F>,
  next: FieldTree<T, S, F>,
  uiState: UiStateReader,
  fillAsFirstRender: FirstRenderFill<T, S, F>,
  origins: DataOrigins,
  edit?: FieldEdit,
  judgedClears?: JudgedClears,
  isDefaultsChanged = false,
): { formData: T | undefined; itemMoves: ContainerKeyMove[] } {
  const itemMoves: ContainerKeyMove[] = [];
  const sanitized = walk(
    {
      oldSchemaUtils: previous.schemaUtils,
      schemaUtils: next.schemaUtils,
      uiState,
      oldUiState: uiState,
      editedPath: edit?.path,
      newKeyOf: edit?.newKeyOf,
      switchedFrom: edit?.switchedFrom,
      enteredAlong: pathsAlong(origins.entered),
      seededAlong: pathsAlong(origins.seeded),
      oldData: previous.formData,
      oldTree: previous,
      fillAsFirstRender,
      judgedClears,
      itemMoves,
      isDefaultsChanged,
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
      oldUiSchema: resolveUiSchema<T, S, F>(previous.schemaUtils.getRootSchema(), previous.uiSchema, {
        rootSchema: previous.schemaUtils.getRootSchema(),
        uiSchemaDefinitions: previous.uiSchema?.[UI_DEFINITIONS_KEY],
      }),
      oldRetrieved: previous.retrievedSchema,
      newRetrieved: next.retrievedSchema,
    },
    [],
  );
  return { formData: sanitized === DROP ? undefined : asFieldValue<T>(sanitized), itemMoves };
}
