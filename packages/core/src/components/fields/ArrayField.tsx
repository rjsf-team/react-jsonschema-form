import type { MouseEvent } from 'react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type {
  ArrayFieldTemplateProps,
  ErrorSchema,
  FieldPath,
  FieldProps,
  FormContextType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  UIOptionsType,
} from '@rjsf/utils';
import {
  setByPath,
  allowAdditionalItems,
  getItemUiSchemaForItem,
  getStaticItemsUiSchema,
  getTemplate,
  getUiOptions,
  getWidget,
  isCustomWidget,
  isFixedItems,
  isFormDataAvailable,
  isObject,
  optionsList,
  shouldRenderOptionalField,
  toFieldPath,
  fieldPathEndsWithIndex,
  fieldPathToId,
  fieldPathToName,
  ITEMS_KEY,
  TranslatableString,
} from '@rjsf/utils';

/** An item of the `formData` paired with its stable React key */
interface KeyedFormDataType<T> {
  key: string;
  item: T;
}

/** Used to generate a unique ID for an element in a row */
let rowIdCounter = 0;

function generateRowId() {
  rowIdCounter += 1;
  return `rjsf-array-item-${rowIdCounter}`;
}

/** Converts `KeyedFormDataType` data into the inner `formData`
 *
 * @param keyedFormData - The `KeyedFormDataType` to be converted
 * @returns - The inner `formData` item(s) in the `keyedFormData`
 */
function keyedToPlainFormData<T>(keyedFormData: KeyedFormDataType<T> | KeyedFormDataType<T>[]): T[] {
  if (Array.isArray(keyedFormData)) {
    return keyedFormData.map((keyedItem) => keyedItem.item);
  }
  return [];
}

/** Determines whether the item described in the schema is always required, which is determined by whether any item
 * may be null.
 *
 * @param itemSchema - The schema for the item
 * @return - True if the item schema type does not contain the "null" type
 */
function isItemRequired<S extends StrictRJSFSchema = RJSFSchema>(itemSchema: S) {
  if (Array.isArray(itemSchema.type)) {
    // While we don't yet support composite/nullable jsonschema types, it's
    // future-proof to check for requirement against these.
    return !itemSchema.type.includes('null');
  }
  // All non-null array item types are inherently required by design
  return itemSchema.type !== 'null';
}

/** Determines whether more items can be added to the array. If the uiSchema indicates the array doesn't allow adding
 * then false is returned. Otherwise, if the schema indicates that there are a maximum number of items and the
 * `formData` matches that value, then false is returned, otherwise true is returned.
 *
 * @param registry - The registry
 * @param schema - The schema for the field
 * @param formItems - The list of items in the form
 * @param [uiSchema] - The UiSchema for the field
 * @returns - True if the item is addable otherwise false
 */
function canAddItem<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  registry: Registry<T[], S, F>,
  schema: S,
  formItems: T[],
  uiSchema?: UiSchema<T[], S, F>,
) {
  let { addable } = getUiOptions<T[], S, F>(uiSchema, registry.globalUiOptions);
  if (addable !== false) {
    // if ui:options.addable was not explicitly set to false, we can add
    // another item if we have not exceeded maxItems yet
    if (schema.maxItems !== undefined) {
      addable = formItems.length < schema.maxItems;
    } else {
      addable = true;
    }
  }
  return addable;
}

/** Returns the default form information for an item based on the schema for that item. Deals with the possibility
 * that the schema is fixed and allows additional items.
 *
 * @param index - The position the new row is being inserted at, so a tuple-position (array) form of
 *          `uiSchema.items` resolves the same entry that the row will actually render with once added
 */
function getNewFormDataRow<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  registry: Registry<T[], S, F>,
  schema: S,
  index: number,
  uiSchema?: UiSchema<T[], S, F>,
): T {
  const { schemaUtils, globalFormOptions, uiSchemaDefinitions } = registry;
  let itemSchema = schema.items as S;
  // Cast this (and the uiSchema below) as T/T[] to work around schema utils being for T/T[] caused by the
  // FieldProps<T[], S, F> call on the class
  let itemUiSchema = getStaticItemsUiSchema<T[], S, F>(uiSchema, index);
  if (globalFormOptions.useFallbackUiForUnsupportedType && !itemSchema) {
    // If we don't have itemSchema and useFallbackUiForUnsupportedType is on, use an empty schema
    itemSchema = {} as S;
  } else if (isFixedItems(schema) && allowAdditionalItems(schema)) {
    // A new row beyond the fixed tuple's own positions is rendered with `uiSchema.additionalItems` elsewhere in this
    // field (see the `itemUiSchema` assignment below), so its default must be computed against the same uiSchema.
    itemSchema = schema.additionalItems as S;
    itemUiSchema = uiSchema?.additionalItems as UiSchema<T[], S, F> | undefined;
  }
  // `uiSchemaDefinitions` comes from the registry (the root uiSchema's `ui:definitions`) since `itemUiSchema` is
  // only the array's own sub-uiSchema and never carries `ui:definitions` itself.
  return schemaUtils.getDefaultFormState(
    itemSchema,
    undefined,
    false,
    undefined,
    itemUiSchema,
    uiSchemaDefinitions,
  ) as unknown as T;
}

/** Props used for ArrayAsXxxx type components*/
interface ArrayAsFieldProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends FieldProps<T, S, F> {
  /** The callback used to update the array when the selector changes */
  onSelectChange: (value: T) => void;
  /** The HTML name for the widget, generated with the multi-value flag since these widgets accept several values */
  htmlName?: string;
}

/** Renders an array as a set of checkboxes using the 'select' widget
 */
function ArrayAsMultiSelect<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayAsFieldProps<T[], S, F>,
) {
  const {
    schema,
    id,
    uiSchema,
    formData: items = [],
    disabled = false,
    readonly = false,
    autofocus = false,
    required = false,
    onBlur,
    onFocus,
    registry,
    rawErrors,
    hideError,
    name,
    onSelectChange,
    htmlName,
  } = props;
  const { widgets, schemaUtils, globalUiOptions } = registry;
  const itemsSchema = schemaUtils.retrieveSchema(schema.items as S, items);
  // For computing `enumOptions`, fallback to the array property's uiSchema if there is no `items` schema
  // Avoids a breaking change reported in https://github.com/rjsf-team/react-jsonschema-form/issues/4985
  const itemsUiSchema = (uiSchema?.items ?? uiSchema) as UiSchema<T[], S, F>;
  const enumOptions = optionsList<T[], S, F>(itemsSchema, itemsUiSchema);
  const {
    widget = 'select',
    title: uiTitle,
    placeholder,
    ...options
  } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T[], S, F>(schema, widget, widgets);
  const label = uiTitle ?? schema.title ?? name;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  return (
    <Widget
      id={id}
      name={name}
      multiple
      onChange={onSelectChange}
      onBlur={onBlur}
      onFocus={onFocus}
      options={{ ...options, enumOptions }}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      value={items}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      required={required}
      label={label}
      hideLabel={!displayLabel}
      placeholder={placeholder}
      autofocus={autofocus}
      rawErrors={rawErrors}
      htmlName={htmlName}
    />
  );
}

/** Renders an array using the custom widget provided by the user in the `uiSchema`
 */
function ArrayAsCustomWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayAsFieldProps<T[], S, F>,
) {
  const {
    schema,
    id,
    uiSchema,
    disabled = false,
    readonly = false,
    autofocus = false,
    required = false,
    hideError,
    onBlur,
    onFocus,
    formData: items = [],
    registry,
    rawErrors,
    name,
    onSelectChange,
    htmlName,
  } = props;
  const { widgets, schemaUtils, globalUiOptions } = registry;
  const { widget, title: uiTitle, placeholder, ...options } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T[], S, F>(schema, widget, widgets);
  const label = uiTitle ?? schema.title ?? name;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  return (
    <Widget
      id={id}
      name={name}
      multiple
      onChange={onSelectChange}
      onBlur={onBlur}
      onFocus={onFocus}
      options={options}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      value={items}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      required={required}
      label={label}
      hideLabel={!displayLabel}
      placeholder={placeholder}
      autofocus={autofocus}
      rawErrors={rawErrors}
      htmlName={htmlName}
    />
  );
}

/** Renders an array of files using the `FileWidget`
 */
function ArrayAsFiles<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayAsFieldProps<T[], S, F>,
) {
  const {
    schema,
    uiSchema,
    id,
    name,
    disabled = false,
    readonly = false,
    autofocus = false,
    required = false,
    onBlur,
    onFocus,
    registry,
    formData: items = [],
    rawErrors,
    hideError,
    onSelectChange,
    htmlName,
  } = props;
  const { widgets, schemaUtils, globalUiOptions } = registry;
  const {
    widget = 'files',
    title: uiTitle,
    placeholder,
    ...options
  } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T[], S, F>(schema, widget, widgets);
  const label = uiTitle ?? schema.title ?? name;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  return (
    <Widget
      options={options}
      id={id}
      name={name}
      multiple
      onChange={onSelectChange}
      onBlur={onBlur}
      onFocus={onFocus}
      schema={schema}
      uiSchema={uiSchema}
      value={items}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      required={required}
      registry={registry}
      autofocus={autofocus}
      rawErrors={rawErrors}
      label={label}
      hideLabel={!displayLabel}
      placeholder={placeholder}
      htmlName={htmlName}
    />
  );
}

/** Renders the individual array item using a `SchemaField` along with the additional properties that are needed to
 * render the whole of the `ArrayFieldItemTemplate`.
 */
function ArrayFieldItemInner<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(props: {
  itemKey: string;
  index: number;
  name: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  hideError: boolean;
  registry: Registry<T[], S, F>;
  uiOptions: UIOptionsType<T[], S, F>;
  parentUiSchema: UiSchema<T[], S, F>;
  title: string | undefined;
  canAdd: boolean;
  canRemove?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  rawItemSchema: S;
  itemData: T[];
  itemUiSchema: UiSchema<T[], S, F> | undefined;
  parentFieldPath: FieldPath;
  itemErrorSchema?: ErrorSchema<T>;
  autofocus?: boolean;
  onBlur: FieldProps<T[], S, F>['onBlur'];
  onFocus: FieldProps<T[], S, F>['onFocus'];
  onChange: FieldProps<T[], S, F>['onChange'];
  rawErrors?: string[];
  totalItems: number;
  handleAddItem: (event: MouseEvent, index?: number) => void;
  handleCopyItem: (event: MouseEvent, index: number) => void;
  handleRemoveItem: (event: MouseEvent, index: number) => void;
  handleReorderItems: (event: MouseEvent<HTMLButtonElement>, index: number, newIndex: number) => void;
}) {
  const {
    itemKey,
    index,
    name,
    disabled,
    hideError,
    readonly,
    registry,
    uiOptions,
    parentUiSchema,
    canAdd,
    canRemove = true,
    canMoveUp,
    canMoveDown,
    rawItemSchema,
    itemData,
    itemUiSchema,
    parentFieldPath,
    itemErrorSchema,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    rawErrors,
    totalItems,
    title,
    handleAddItem,
    handleCopyItem,
    handleRemoveItem,
    handleReorderItems,
  } = props;
  const {
    schemaUtils,
    fields: { ArraySchemaField, SchemaField },
    globalUiOptions,
    globalFormOptions,
  } = registry;
  const itemSchema = useMemo(
    () => schemaUtils.retrieveSchema(rawItemSchema, itemData),
    [schemaUtils, rawItemSchema, itemData],
  );
  const fieldPath = toFieldPath(index, parentFieldPath);
  const fieldId = fieldPathToId(fieldPath, globalFormOptions);
  const ItemSchemaField = ArraySchemaField || SchemaField;
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T[], S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions,
  );
  const displayLabel = schemaUtils.getDisplayLabel(itemSchema, itemUiSchema, globalUiOptions);
  const { description } = getUiOptions(itemUiSchema);
  const hasDescription = !!description || !!itemSchema.description;
  const { orderable = true, removable = true, copyable = false } = uiOptions;
  const has: Record<string, boolean> = {
    moveUp: orderable && canMoveUp,
    moveDown: orderable && canMoveDown,
    copy: copyable && canAdd,
    remove: removable && canRemove,
    toolbar: false,
  };
  has.toolbar = Object.keys(has).some((key: keyof typeof has) => has[key]);

  const onAddItem = useCallback(
    (event: MouseEvent) => {
      handleAddItem(event, index + 1);
    },
    [handleAddItem, index],
  );
  const onCopyItem = useCallback(
    (event: MouseEvent) => {
      handleCopyItem(event, index);
    },
    [handleCopyItem, index],
  );
  const onRemoveItem = useCallback(
    (event: MouseEvent) => {
      handleRemoveItem(event, index);
    },
    [handleRemoveItem, index],
  );
  const onMoveUpItem = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      handleReorderItems(event, index, index - 1);
    },
    [handleReorderItems, index],
  );
  const onMoveDownItem = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      handleReorderItems(event, index, index + 1);
    },
    [handleReorderItems, index],
  );

  const templateProps = {
    children: (
      <ItemSchemaField
        name={name}
        title={title}
        index={index}
        schema={itemSchema}
        uiSchema={itemUiSchema}
        formData={itemData}
        // ItemSchemaField comes from a registry typed for the array, so it takes a single item's errors as T[] too
        errorSchema={itemErrorSchema as ErrorSchema<T[]> | undefined}
        fieldPath={fieldPath}
        id={fieldId}
        required={isItemRequired<S>(itemSchema)}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        registry={registry}
        disabled={disabled}
        readonly={readonly}
        hideError={hideError}
        autofocus={autofocus}
        rawErrors={rawErrors}
      />
    ),
    buttonsProps: {
      id: fieldId,
      disabled,
      readonly,
      canAdd,
      hasCopy: has.copy,
      hasMoveUp: has.moveUp,
      hasMoveDown: has.moveDown,
      hasRemove: has.remove,
      index,
      totalItems,
      onAddItem,
      onCopyItem,
      onRemoveItem,
      onMoveUpItem,
      onMoveDownItem,
      registry,
      schema: itemSchema,
      uiSchema: itemUiSchema,
    },
    itemKey,
    className: 'rjsf-array-item',
    disabled,
    hasToolbar: has.toolbar,
    index,
    totalItems,
    readonly,
    registry,
    schema: itemSchema,
    uiSchema: itemUiSchema,
    parentUiSchema,
    displayLabel,
    hasDescription,
  };
  return <ArrayFieldItemTemplate {...templateProps} />;
}
const ArrayFieldItem = memo(ArrayFieldItemInner) as typeof ArrayFieldItemInner;

/** The properties required by the stateless components that render the items using the `ArrayFieldItem` */
interface InternalArrayFieldProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends FieldProps<T[], S, F> {
  /** The `formData` items paired with their stable React keys */
  keyedFormData: KeyedFormDataType<T>[];
  /** The callback used to handle the adding of an item at the given index (or the end, if missing) */
  handleAddItem: (event: MouseEvent, index?: number) => void;
  /** The callback used to handle the copying of the item at the given index, below itself */
  handleCopyItem: (event: MouseEvent, index: number) => void;
  /** The callback used to handle removing an item at the given index */
  handleRemoveItem: (event: MouseEvent, index: number) => void;
  /** The callback used to handle reordering an item at the given index to its newIndex */
  handleReorderItems: (event: MouseEvent<HTMLButtonElement>, index: number, newIndex: number) => void;
}

/** Renders a normal array without any limitations of length
 */
function NormalArray<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: InternalArrayFieldProps<T, S, F>,
) {
  const {
    schema,
    uiSchema = {},
    errorSchema,
    fieldPath,
    id,
    formData: formDataFromProps,
    name,
    title,
    disabled = false,
    readonly = false,
    autofocus = false,
    required = false,
    hideError = false,
    registry,
    onBlur,
    onFocus,
    rawErrors,
    onChange,
    keyedFormData,
    handleAddItem,
    handleCopyItem,
    handleRemoveItem,
    handleReorderItems,
  } = props;
  const fieldTitle = schema.title || title || name;
  const { schemaUtils, fields, formContext, globalUiOptions } = registry;
  const { OptionalDataControlsField } = fields;
  const uiOptions = useMemo(() => getUiOptions<T[], S, F>(uiSchema, globalUiOptions), [uiSchema, globalUiOptions]);
  // Memoize schemaItems to avoid a new `{}` object identity on every render (which would bust retrieveSchema cache)
  const schemaItems: S = useMemo(() => (isObject(schema.items) ? (schema.items as S) : ({} as S)), [schema.items]);
  const itemsSchema: S = useMemo(() => schemaUtils.retrieveSchema(schemaItems), [schemaUtils, schemaItems]);
  const formData = useMemo(() => keyedToPlainFormData<T>(keyedFormData), [keyedFormData]);
  const renderOptionalField = shouldRenderOptionalField<T[], S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T[]>(formDataFromProps);
  const canAdd = useMemo(
    () => canAddItem<T, S, F>(registry, schema, formData, uiSchema) && (!renderOptionalField || hasFormData),
    [registry, schema, formData, uiSchema, renderOptionalField, hasFormData],
  );
  const actualFormData = hasFormData ? keyedFormData : [];
  const extraClass = renderOptionalField ? ' rjsf-optional-array-field' : '';
  const optionalDataControl = renderOptionalField ? <OptionalDataControlsField {...props} /> : undefined;
  const arrayProps: ArrayFieldTemplateProps<T[], S, F> = {
    canAdd,
    items: actualFormData.map((keyedItem, index: number) => {
      const { key, item } = keyedItem;
      // While we are actually dealing with a single item of type T, the types require a T[], so cast
      const itemCast = item as unknown as T[];
      const itemErrorSchema = errorSchema?.[index];

      // Compute the item UI schema using the helper method
      const itemUiSchema = getItemUiSchemaForItem<T[], S, F>(uiSchema, itemCast, index, formContext);

      const itemProps = {
        itemKey: key,
        index,
        name: name && `${name}-${index}`,
        registry,
        uiOptions,
        parentUiSchema: uiSchema,
        hideError,
        readonly,
        disabled,
        required,
        title: fieldTitle ? `${fieldTitle}-${index + 1}` : undefined,
        canAdd,
        canMoveUp: index > 0,
        canMoveDown: index < formData.length - 1,
        rawItemSchema: schemaItems,
        parentFieldPath: fieldPath,
        itemErrorSchema,
        itemData: itemCast,
        itemUiSchema,
        autofocus: autofocus && index === 0,
        onBlur,
        onFocus,
        rawErrors,
        totalItems: keyedFormData.length,
        handleAddItem,
        handleCopyItem,
        handleRemoveItem,
        handleReorderItems,
        onChange,
      };
      return <ArrayFieldItem key={key} {...itemProps} />;
    }),
    className: `rjsf-field rjsf-field-array rjsf-field-array-of-${itemsSchema.type}${extraClass}`,
    disabled,
    id,
    uiSchema,
    onAddClick: handleAddItem,
    readonly,
    hideError,
    required,
    schema,
    title: fieldTitle,
    formData,
    rawErrors,
    registry,
    optionalDataControl,
  };

  const Template = getTemplate<'ArrayFieldTemplate', T[], S, F>('ArrayFieldTemplate', registry, uiOptions);
  return <Template {...arrayProps} />;
}

/** Renders an array that has a maximum limit of items
 */
function FixedArray<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: InternalArrayFieldProps<T, S, F>,
) {
  const {
    schema,
    uiSchema = {},
    formData,
    errorSchema,
    fieldPath,
    id,
    name,
    title,
    disabled = false,
    readonly = false,
    autofocus = false,
    required = false,
    hideError = false,
    registry,
    onBlur,
    onFocus,
    rawErrors,
    keyedFormData,
    onChange,
    handleAddItem,
    handleCopyItem,
    handleRemoveItem,
    handleReorderItems,
  } = props;
  let { formData: items = [] } = props;
  const fieldTitle = schema.title || title || name;
  const { fields, formContext, globalUiOptions } = registry;
  const uiOptions = useMemo(() => getUiOptions<T[], S, F>(uiSchema, globalUiOptions), [uiSchema, globalUiOptions]);
  const { OptionalDataControlsField } = fields;
  const renderOptionalField = shouldRenderOptionalField<T[], S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T[]>(formData);
  const schemaItems = useMemo<S[]>(() => (Array.isArray(schema.items) ? (schema.items as S[]) : []), [schema.items]);
  const hasAdditionalItems = isObject(schema.additionalItems);

  if (items.length < schemaItems.length) {
    // to make sure at least all fixed items are generated
    items = items.concat(new Array(schemaItems.length - items.length));
  }
  const actualFormData = hasFormData ? keyedFormData : [];
  const extraClass = renderOptionalField ? ' rjsf-optional-array-field' : '';
  const optionalDataControl = renderOptionalField ? <OptionalDataControlsField {...props} /> : undefined;

  // These are the props passed into the render function
  const canAdd =
    canAddItem<T, S, F>(registry, schema, items, uiSchema) &&
    hasAdditionalItems &&
    (!renderOptionalField || hasFormData);
  const arrayProps: ArrayFieldTemplateProps<T[], S, F> = {
    canAdd,
    className: `rjsf-field rjsf-field-array rjsf-field-array-fixed-items${extraClass}`,
    disabled,
    id,
    formData,
    items: actualFormData.map((keyedItem, index) => {
      const { key, item } = keyedItem;
      // While we are actually dealing with a single item of type T, the types require a T[], so cast
      const itemCast = item as unknown as T[];
      const additional = index >= schemaItems.length;
      const rawItemSchema =
        (additional && isObject(schema.additionalItems) ? (schema.additionalItems as S) : schemaItems[index]) ||
        ({} as S);
      // Compute the item UI schema - handle both static and dynamic cases
      let itemUiSchema: UiSchema<T[], S, F> | undefined;
      if (additional) {
        // For additional items, use additionalItems uiSchema
        itemUiSchema = uiSchema.additionalItems as UiSchema<T[], S, F>;
      } else if (Array.isArray(uiSchema.items)) {
        // For fixed items, uiSchema.items can be an array, a function, or a single object
        itemUiSchema = uiSchema.items[index] as UiSchema<T[], S, F>;
      } else {
        // Use the helper method for function or static object cases
        itemUiSchema = getItemUiSchemaForItem<T[], S, F>(uiSchema, itemCast, index, formContext);
      }
      const itemErrorSchema = errorSchema?.[index];

      const itemProps = {
        index,
        itemKey: key,
        name: name && `${name}-${index}`,
        registry,
        uiOptions,
        parentUiSchema: uiSchema,
        hideError,
        readonly,
        disabled,
        required,
        title: fieldTitle ? `${fieldTitle}-${index + 1}` : undefined,
        canAdd,
        canRemove: additional,
        canMoveUp: index >= schemaItems.length + 1,
        canMoveDown: additional && index < items.length - 1,
        rawItemSchema,
        itemData: itemCast,
        itemUiSchema,
        parentFieldPath: fieldPath,
        itemErrorSchema,
        autofocus: autofocus && index === 0,
        onBlur,
        onFocus,
        rawErrors,
        totalItems: keyedFormData.length,
        onChange,
        handleAddItem,
        handleCopyItem,
        handleRemoveItem,
        handleReorderItems,
      };
      return <ArrayFieldItem key={key} {...itemProps} />;
    }),
    onAddClick: handleAddItem,
    readonly,
    hideError,
    required,
    registry,
    schema,
    uiSchema,
    title: fieldTitle,
    errorSchema,
    rawErrors,
    optionalDataControl,
  };

  const Template = getTemplate<'ArrayFieldTemplate', T[], S, F>('ArrayFieldTemplate', registry, uiOptions);
  return <Template {...arrayProps} />;
}

interface KeyedFormDataState<T = any> {
  /** The keyed form data elements */
  keyedFormData: KeyedFormDataType<T>[];
  /** Updates the keyed form data elements to the given value */
  updateKeyedFormData: (newData: KeyedFormDataType<T>[]) => T[];
}

const NO_ITEMS: never[] = [];

/** Pairs each item of the `formData` prop with a stable React key. Only the keys live in state: the items are read
 * from props on every render, so the rows always show the value the form actually holds, never a proposal the field
 * made and the form did not commit. The keys are UI metadata, kept so that React reuses row instances (and their DOM
 * focus) across accepted adds, removes and reorders. When the array's length changes outside the handlers, an external
 * replacement or a proposal the form transformed, there is no way to tell which rows survived, so every key is
 * regenerated.
 */
function useKeyedFormData<T = any>(formData: T[] = NO_ITEMS): KeyedFormDataState<T> {
  const items: T[] = Array.isArray(formData) ? formData : NO_ITEMS;
  const freshKeys = () => items.map(generateRowId);
  const [keys, setKeys] = useState<string[]>(freshKeys);

  let itemKeys = keys;
  if (itemKeys.length !== items.length) {
    itemKeys = freshKeys();
    setKeys(itemKeys);
  }

  const keyedFormData = useMemo(() => itemKeys.map((key, index) => ({ key, item: items[index] })), [itemKeys, items]);

  const updateKeyedFormData = useCallback((newData: KeyedFormDataType<T>[]) => {
    setKeys(newData.map((keyedItem) => keyedItem.key));
    return keyedToPlainFormData(newData);
  }, []);

  return { keyedFormData, updateKeyedFormData };
}

/** The `ArrayField` component is used to render a field in the schema that is of type `array`. It supports both normal
 * and fixed array, allowing user to add and remove elements from the array data.
 */
export default function ArrayField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T[], S, F>,
) {
  const { schema, uiSchema, errorSchema, fieldPath, id: fieldId, registry, formData, onChange } = props;
  const { globalFormOptions, schemaUtils, translateString } = registry;
  const { keyedFormData, updateKeyedFormData } = useKeyedFormData<T>(formData);
  // Refs keep the latest values accessible inside stable useCallback closures without being in the dep array,
  // so the four mutation handlers don't get new references on every keyedFormData / errorSchema change.
  const keyedFormDataRef = useRef(keyedFormData);
  keyedFormDataRef.current = keyedFormData;
  const errorSchemaRef = useRef(errorSchema);
  errorSchemaRef.current = errorSchema;

  /** Callback handler for when the user clicks on the add or add at index buttons. Creates a new row of keyed form data
   * either at the end of the list (when index is not specified) or inserted at the `index` when it is, adding it into
   * the state, and then returning `onChange()` with the plain form data converted from the keyed data
   *
   * @param event - The event for the click
   * @param [index] - The optional index at which to add the new data
   */
  const handleAddItem = useCallback(
    (event: MouseEvent, index?: number) => {
      if (event) {
        event.preventDefault();
      }

      let newErrorSchema: ErrorSchema<T[]> | undefined;
      if (errorSchemaRef.current) {
        newErrorSchema = {};
        for (const idx of Object.keys(errorSchemaRef.current)) {
          const i = parseInt(idx, 10);
          if (index === undefined || i < index) {
            setByPath(newErrorSchema, i, errorSchemaRef.current[i]);
          } else if (i >= index) {
            setByPath(newErrorSchema, i + 1, errorSchemaRef.current[i]);
          }
        }
      }

      const newKeyedFormDataRow: KeyedFormDataType<T> = {
        key: generateRowId(),
        item: getNewFormDataRow<T, S, F>(registry, schema, index ?? keyedFormDataRef.current.length, uiSchema),
      };
      const newKeyedFormData = [...keyedFormDataRef.current];
      if (index !== undefined) {
        newKeyedFormData.splice(index, 0, newKeyedFormDataRow);
      } else {
        newKeyedFormData.push(newKeyedFormDataRow);
      }
      onChange(updateKeyedFormData(newKeyedFormData), fieldPath, newErrorSchema);
    },
    [registry, schema, uiSchema, onChange, updateKeyedFormData, fieldPath],
  );

  /** Callback handler for when the user clicks on the copy button on an existing array element. Clones the row of
   * keyed form data at the `index` into the next position in the state, and then returning `onChange()` with the plain
   * form data converted from the keyed data
   *
   * @param index - The index at which the copy button is clicked
   */
  const handleCopyItem = useCallback(
    (event: MouseEvent, index: number) => {
      if (event) {
        event.preventDefault();
      }

      let newErrorSchema: ErrorSchema<T[]> | undefined;
      if (errorSchemaRef.current) {
        newErrorSchema = {};
        for (const idx of Object.keys(errorSchemaRef.current)) {
          const i = parseInt(idx, 10);
          if (i <= index) {
            setByPath(newErrorSchema, i, errorSchemaRef.current[i]);
          } else if (i > index) {
            setByPath(newErrorSchema, i + 1, errorSchemaRef.current[i]);
          }
        }
      }

      const newKeyedFormDataRow: KeyedFormDataType<T> = {
        key: generateRowId(),
        item: structuredClone(keyedFormDataRef.current[index].item),
      };
      const newKeyedFormData = [...keyedFormDataRef.current];
      if (index !== undefined) {
        newKeyedFormData.splice(index + 1, 0, newKeyedFormDataRow);
      } else {
        newKeyedFormData.push(newKeyedFormDataRow);
      }
      onChange(updateKeyedFormData(newKeyedFormData), fieldPath, newErrorSchema);
    },
    [onChange, updateKeyedFormData, fieldPath],
  );

  /** Callback handler for when the user clicks on the remove button on an existing array element. Removes the row of
   * keyed form data at the `index` in the state, and then returning `onChange()` with the plain form data converted
   * from the keyed data
   *
   * @param index - The index at which the remove button is clicked
   */
  const handleRemoveItem = useCallback(
    (event: MouseEvent, index: number) => {
      if (event) {
        event.preventDefault();
      }
      // refs #195: revalidate to ensure properly reindexing errors
      let newErrorSchema: ErrorSchema<T[]> | undefined;
      if (errorSchemaRef.current) {
        newErrorSchema = {};
        for (const idx of Object.keys(errorSchemaRef.current)) {
          const i = parseInt(idx, 10);
          if (i < index) {
            setByPath(newErrorSchema, i, errorSchemaRef.current[i]);
          } else if (i > index) {
            setByPath(newErrorSchema, i - 1, errorSchemaRef.current[i]);
          }
        }
      }
      const newKeyedFormData = keyedFormDataRef.current.filter((_, i) => i !== index);
      onChange(updateKeyedFormData(newKeyedFormData), fieldPath, newErrorSchema);
    },
    [onChange, updateKeyedFormData, fieldPath],
  );

  /** Callback handler for when the user clicks on one of the move item buttons on an existing array element. Moves the
   * row of keyed form data at the `index` to the `newIndex` in the state, and then returning `onChange()` with the
   * plain form data converted from the keyed data
   *
   * @param index - The index of the item to move
   * @param newIndex - The index to where the item is to be moved
   */
  const handleReorderItems = useCallback(
    (event: MouseEvent<HTMLButtonElement>, index: number, newIndex: number) => {
      if (event) {
        event.preventDefault();
        event.currentTarget.blur();
      }
      let newErrorSchema: ErrorSchema<T[]> | undefined;
      if (errorSchemaRef.current) {
        newErrorSchema = {};
        for (const idx of Object.keys(errorSchemaRef.current)) {
          const i = parseInt(idx, 10);
          if (i === index) {
            setByPath(newErrorSchema, newIndex, errorSchemaRef.current[index]);
          } else if (i === newIndex) {
            setByPath(newErrorSchema, index, errorSchemaRef.current[newIndex]);
          } else {
            setByPath(newErrorSchema, idx, errorSchemaRef.current[i]);
          }
        }
      }

      function reOrderArray() {
        const newKeyedFormData = keyedFormDataRef.current.slice();
        newKeyedFormData.splice(index, 1);
        newKeyedFormData.splice(newIndex, 0, keyedFormDataRef.current[index]);
        return newKeyedFormData;
      }
      const newKeyedFormData = reOrderArray();
      onChange(updateKeyedFormData(newKeyedFormData), fieldPath, newErrorSchema);
    },
    [onChange, updateKeyedFormData, fieldPath],
  );

  /** Callback handler used to deal with changing the value of the data in the array at the `index`. Calls the
   * `onChange` callback with the updated form data
   *
   * @param index - The index of the item being changed
   */
  const handleChange = useCallback(
    (value: any, changedFieldPath: FieldPath, newErrorSchema?: ErrorSchema<T[]>, id?: string) => {
      const lastPathIsItemIndex = fieldPathEndsWithIndex(changedFieldPath);
      onChange(
        // We need to treat undefined items as nulls to have validation.
        // See https://github.com/tdegrunt/jsonschema/issues/206
        // Only set to null for array items, and not for object properties within array items
        lastPathIsItemIndex && value === undefined ? null : value,
        changedFieldPath,
        newErrorSchema,
        id,
      );
    },
    [onChange],
  );

  /** Callback handler used to change the value for a checkbox */
  const onSelectChange = useCallback(
    (value: any) => {
      onChange(value, fieldPath, undefined, fieldId);
    },
    [onChange, fieldPath, fieldId],
  );

  const isMissingItems = !(ITEMS_KEY in schema);
  if (isMissingItems && !globalFormOptions.useFallbackUiForUnsupportedType) {
    const uiOptions = getUiOptions<T[], S, F>(uiSchema);
    const UnsupportedFieldTemplate = getTemplate<'UnsupportedFieldTemplate', T[], S, F>(
      'UnsupportedFieldTemplate',
      registry,
      uiOptions,
    );

    return (
      <UnsupportedFieldTemplate
        schema={schema}
        uiSchema={uiSchema}
        id={fieldId}
        reason={translateString(TranslatableString.MissingItems)}
        registry={registry}
      />
    );
  }
  // An items schema with type as undefined triggers FallbackField later on
  const arraySchema = isMissingItems ? { ...schema, [ITEMS_KEY]: { type: undefined } } : schema;
  const arrayAsMultiProps: ArrayAsFieldProps<T[], S, F> = {
    ...props,
    schema: arraySchema,
    formData,
    fieldPath,
    onSelectChange,
    htmlName: fieldPathToName(fieldPath, globalFormOptions, true),
  };
  const arrayProps: InternalArrayFieldProps<T, S, F> = {
    ...props,
    schema: arraySchema,
    handleAddItem,
    handleCopyItem,
    handleRemoveItem,
    handleReorderItems,
    keyedFormData,
    onChange: handleChange,
  };
  if (schemaUtils.isMultiSelect(arrayAsMultiProps.schema)) {
    // If array has enum or uniqueItems set to true, call renderMultiSelect() to render the default multiselect widget or a custom widget, if specified.
    return <ArrayAsMultiSelect<T, S, F> {...arrayAsMultiProps} />;
  }
  if (isCustomWidget<T[], S, F>(uiSchema)) {
    return <ArrayAsCustomWidget<T, S, F> {...arrayAsMultiProps} />;
  }
  if (isFixedItems(arrayAsMultiProps.schema)) {
    return <FixedArray<T, S, F> {...arrayProps} />;
  }
  if (schemaUtils.isFilesArray(arrayAsMultiProps.schema, uiSchema)) {
    return <ArrayAsFiles<T, S, F> {...arrayAsMultiProps} />;
  }
  return <NormalArray<T, S, F> {...arrayProps} />;
}
