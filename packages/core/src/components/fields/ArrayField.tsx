import { MouseEvent, useCallback, useState } from 'react';
import {
  allowAdditionalItems,
  getTemplate,
  getUiOptions,
  getWidget,
  hashObject,
  isCustomWidget,
  isFixedItems,
  isFormDataAvailable,
  optionsList,
  shouldRenderOptionalField,
  toFieldPathId,
  useDeepCompareMemo,
  ITEMS_KEY,
  ID_KEY,
  ArrayFieldTemplateProps,
  ErrorSchema,
  FieldPathId,
  FieldPathList,
  FieldProps,
  FormContextType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  UiSchema,
  UIOptionsType,
} from '@rjsf/utils';
import cloneDeep from 'lodash/cloneDeep';
import isObject from 'lodash/isObject';
import set from 'lodash/set';
import uniqueId from 'lodash/uniqueId';

/** Type used to represent the keyed form data used in the state */
type KeyedFormDataType<T> = { key: string; item: T };

/** Used to generate a unique ID for an element in a row */
function generateRowId() {
  return uniqueId('rjsf-array-item-');
}

/** Converts the `formData` into `KeyedFormDataType` data, using the `generateRowId()` function to create the key
 *
 * @param formData - The data for the form
 * @returns - The `formData` converted into a `KeyedFormDataType` element
 */
function generateKeyedFormData<T>(formData?: T[]): KeyedFormDataType<T>[] {
  return !Array.isArray(formData)
    ? []
    : formData.map((item) => {
        return {
          key: generateRowId(),
          item,
        };
      });
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

/** Helper method to compute item UI schema for both normal and fixed arrays
 * Handles both static object and dynamic function cases
 *
 * @param uiSchema - The parent UI schema containing items definition
 * @param item - The item data
 * @param index - The index of the item
 * @param formContext - The form context
 * @returns The computed UI schema for the item
 */
function computeItemUiSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  uiSchema: UiSchema<T[], S, F>,
  item: T,
  index: number,
  formContext: F,
): UiSchema<T[], S, F> | undefined {
  if (typeof uiSchema.items === 'function') {
    try {
      // Call the function with item data, index, and form context
      // TypeScript now correctly infers the types thanks to the ArrayElement type in UiSchema
      const result = uiSchema.items(item, index, formContext);
      // Only use the result if it's truthy
      return result as UiSchema<T[], S, F>;
    } catch (e) {
      console.error(`Error executing dynamic uiSchema.items function for item at index ${index}:`, e);
      // Fall back to undefined to allow the field to still render
      return undefined;
    }
  } else {
    // Static object case - preserve undefined to maintain backward compatibility
    return uiSchema.items as UiSchema<T[], S, F> | undefined;
  }
}

/** Returns the default form information for an item based on the schema for that item. Deals with the possibility
 * that the schema is fixed and allows additional items.
 */
function getNewFormDataRow<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  registry: Registry<T[], S, F>,
  schema: S,
): T {
  const { schemaUtils } = registry;
  let itemSchema = schema.items as S;
  if (isFixedItems(schema) && allowAdditionalItems(schema)) {
    itemSchema = schema.additionalItems as S;
  }
  // Cast this as a T to work around schema utils being for T[] caused by the FieldProps<T[], S, F> call on the class
  return schemaUtils.getDefaultFormState(itemSchema) as unknown as T;
}

/** Props used for ArrayAsXxxx type components*/
interface ArrayAsFieldProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  extends FieldProps<T, S, F> {
  /** The callback used to update the array when the selector changes */
  onSelectChange: (value: T) => void;
}

/** Renders an array as a set of checkboxes using the 'select' widget
 */
function ArrayAsMultiSelect<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayAsFieldProps<T[], S, F>,
) {
  const {
    schema,
    fieldPathId,
    uiSchema,
    formData: items = [],
    disabled = false,
    readonly = false,
    autofocus = false,
    required = false,
    placeholder,
    onBlur,
    onFocus,
    registry,
    rawErrors,
    name,
    onSelectChange,
  } = props;
  const { widgets, schemaUtils, globalFormOptions, globalUiOptions } = registry;
  const itemsSchema = schemaUtils.retrieveSchema(schema.items as S, items);
  const enumOptions = optionsList<T[], S, F>(itemsSchema, uiSchema);
  const { widget = 'select', title: uiTitle, ...options } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T[], S, F>(schema, widget, widgets);
  const label = uiTitle ?? schema.title ?? name;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  // For custom widgets with multiple=true, generate a fieldPathId with isMultiValue flag
  const multiValueFieldPathId = useDeepCompareMemo(toFieldPathId('', globalFormOptions, fieldPathId, true));
  return (
    <Widget
      id={multiValueFieldPathId[ID_KEY]}
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
      required={required}
      label={label}
      hideLabel={!displayLabel}
      placeholder={placeholder}
      autofocus={autofocus}
      rawErrors={rawErrors}
      htmlName={multiValueFieldPathId.name}
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
    fieldPathId,
    uiSchema,
    disabled = false,
    readonly = false,
    autofocus = false,
    required = false,
    hideError,
    placeholder,
    onBlur,
    onFocus,
    formData: items = [],
    registry,
    rawErrors,
    name,
    onSelectChange,
  } = props;
  const { widgets, schemaUtils, globalFormOptions, globalUiOptions } = registry;
  const { widget, title: uiTitle, ...options } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T[], S, F>(schema, widget, widgets);
  const label = uiTitle ?? schema.title ?? name;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  // For custom widgets with multiple=true, generate a fieldPathId with isMultiValue flag
  const multiValueFieldPathId = useDeepCompareMemo(toFieldPathId('', globalFormOptions, fieldPathId, true));
  return (
    <Widget
      id={multiValueFieldPathId[ID_KEY]}
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
      htmlName={multiValueFieldPathId.name}
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
    fieldPathId,
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
    onSelectChange,
  } = props;
  const { widgets, schemaUtils, globalFormOptions, globalUiOptions } = registry;
  const { widget = 'files', title: uiTitle, ...options } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T[], S, F>(schema, widget, widgets);
  const label = uiTitle ?? schema.title ?? name;
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  // For custom widgets with multiple=true, generate a fieldPathId with isMultiValue flag
  const multiValueFieldPathId = useDeepCompareMemo(toFieldPathId('', globalFormOptions, fieldPathId, true));
  return (
    <Widget
      options={options}
      id={multiValueFieldPathId[ID_KEY]}
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
      required={required}
      registry={registry}
      autofocus={autofocus}
      rawErrors={rawErrors}
      label={label}
      hideLabel={!displayLabel}
      htmlName={multiValueFieldPathId.name}
    />
  );
}

/** Renders the individual array item using a `SchemaField` along with the additional properties that are needed to
 * render the whole of the `ArrayFieldItemTemplate`.
 */
function ArrayFieldItem<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(props: {
  itemKey: string;
  index: number;
  name: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  hideError: boolean;
  registry: Registry<T[], S, F>;
  uiOptions: UIOptionsType<T[], S, F>;
  parentUiSchema?: UiSchema<T[], S, F>;
  title: string | undefined;
  canAdd: boolean;
  canRemove?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  itemSchema: S;
  itemData: T[];
  itemUiSchema: UiSchema<T[], S, F> | undefined;
  itemFieldPathId: FieldPathId;
  itemErrorSchema?: ErrorSchema<T[]>;
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
    itemSchema,
    itemData,
    itemUiSchema,
    itemFieldPathId,
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
    fields: { ArraySchemaField, SchemaField },
  } = registry;
  const fieldPathId = useDeepCompareMemo<FieldPathId>(itemFieldPathId);
  const ItemSchemaField = ArraySchemaField || SchemaField;
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T[], S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions,
  );
  const { orderable = true, removable = true, copyable = false } = uiOptions;
  const has: { [key: string]: boolean } = {
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
        errorSchema={itemErrorSchema}
        fieldPathId={fieldPathId}
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
      fieldPathId,
      disabled,
      readonly,
      canAdd,
      hasCopy: has.copy,
      hasMoveUp: has.moveUp,
      hasMoveDown: has.moveDown,
      hasRemove: has.remove,
      index: index,
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
  };
  return <ArrayFieldItemTemplate {...templateProps} />;
}

/** The properties required by the stateless components that render the items using the `ArrayFieldItem` */
interface InternalArrayFieldProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  extends FieldProps<T[], S, F> {
  /** The keyedFormData from the `ArrayField` state */
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
    fieldPathId,
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
  const { schemaUtils, fields, formContext, globalFormOptions, globalUiOptions } = registry;
  const { OptionalDataControlsField } = fields;
  const uiOptions = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const _schemaItems: S = isObject(schema.items) ? (schema.items as S) : ({} as S);
  const itemsSchema: S = schemaUtils.retrieveSchema(_schemaItems);
  const formData = keyedToPlainFormData<T>(keyedFormData);
  const renderOptionalField = shouldRenderOptionalField<T[], S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T[]>(formDataFromProps);
  const canAdd = canAddItem<T, S, F>(registry, schema, formData, uiSchema) && (!renderOptionalField || hasFormData);
  const actualFormData = hasFormData ? keyedFormData : [];
  const extraClass = renderOptionalField ? ' rjsf-optional-array-field' : '';
  const optionalDataControl = renderOptionalField ? <OptionalDataControlsField {...props} /> : undefined;
  const arrayProps: ArrayFieldTemplateProps<T[], S, F> = {
    canAdd,
    items: actualFormData.map((keyedItem, index: number) => {
      const { key, item } = keyedItem;
      // While we are actually dealing with a single item of type T, the types require a T[], so cast
      const itemCast = item as unknown as T[];
      const itemSchema = schemaUtils.retrieveSchema(_schemaItems, itemCast);
      const itemErrorSchema = errorSchema ? (errorSchema[index] as ErrorSchema<T[]>) : undefined;
      const itemFieldPathId = toFieldPathId(index, globalFormOptions, fieldPathId);

      // Compute the item UI schema using the helper method
      const itemUiSchema = computeItemUiSchema<T, S, F>(uiSchema, item, index, formContext);

      const itemProps = {
        itemKey: key,
        index,
        name: name && `${name}-${index}`,
        registry,
        uiOptions,
        hideError,
        readonly,
        disabled,
        required,
        title: fieldTitle ? `${fieldTitle}-${index + 1}` : undefined,
        canAdd,
        canMoveUp: index > 0,
        canMoveDown: index < formData.length - 1,
        itemSchema,
        itemFieldPathId,
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
    fieldPathId,
    uiSchema,
    onAddClick: handleAddItem,
    readonly,
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
    fieldPathId,
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
  const { schemaUtils, fields, formContext, globalFormOptions, globalUiOptions } = registry;
  const uiOptions = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
  const { OptionalDataControlsField } = fields;
  const renderOptionalField = shouldRenderOptionalField<T[], S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T[]>(formData);
  const _schemaItems: S[] = isObject(schema.items) ? (schema.items as S[]) : ([] as S[]);
  const itemSchemas = _schemaItems.map((item: S, index: number) =>
    schemaUtils.retrieveSchema(item, items[index] as unknown as T[]),
  );
  const additionalSchema = isObject(schema.additionalItems)
    ? schemaUtils.retrieveSchema(schema.additionalItems as S, formData)
    : null;

  if (items.length < itemSchemas.length) {
    // to make sure at least all fixed items are generated
    items = items.concat(new Array(itemSchemas.length - items.length));
  }
  const actualFormData = hasFormData ? keyedFormData : [];
  const extraClass = renderOptionalField ? ' rjsf-optional-array-field' : '';
  const optionalDataControl = renderOptionalField ? <OptionalDataControlsField {...props} /> : undefined;

  // These are the props passed into the render function
  const canAdd =
    canAddItem<T, S, F>(registry, schema, items, uiSchema) &&
    !!additionalSchema &&
    (!renderOptionalField || hasFormData);
  const arrayProps: ArrayFieldTemplateProps<T[], S, F> = {
    canAdd,
    className: `rjsf-field rjsf-field-array rjsf-field-array-fixed-items${extraClass}`,
    disabled,
    fieldPathId,
    formData,
    items: actualFormData.map((keyedItem, index) => {
      const { key, item } = keyedItem;
      // While we are actually dealing with a single item of type T, the types require a T[], so cast
      const itemCast = item as unknown as T[];
      const additional = index >= itemSchemas.length;
      const itemSchema =
        (additional && isObject(schema.additionalItems)
          ? schemaUtils.retrieveSchema(schema.additionalItems as S, itemCast)
          : itemSchemas[index]) || {};
      const itemFieldPathId = toFieldPathId(index, globalFormOptions, fieldPathId);
      // Compute the item UI schema - handle both static and dynamic cases
      let itemUiSchema: UiSchema<T[], S, F> | undefined;
      if (additional) {
        // For additional items, use additionalItems uiSchema
        itemUiSchema = uiSchema.additionalItems as UiSchema<T[], S, F>;
      } else {
        // For fixed items, uiSchema.items can be an array, a function, or a single object
        if (Array.isArray(uiSchema.items)) {
          itemUiSchema = uiSchema.items[index] as UiSchema<T[], S, F>;
        } else {
          // Use the helper method for function or static object cases
          itemUiSchema = computeItemUiSchema<T, S, F>(uiSchema, item, index, formContext);
        }
      }
      const itemErrorSchema = errorSchema ? (errorSchema[index] as ErrorSchema<T[]>) : undefined;

      const itemProps = {
        index,
        itemKey: key,
        name: name && `${name}-${index}`,
        registry,
        uiOptions,
        hideError,
        readonly,
        disabled,
        required,
        title: fieldTitle ? `${fieldTitle}-${index + 1}` : undefined,
        canAdd,
        canRemove: additional,
        canMoveUp: index >= itemSchemas.length + 1,
        canMoveDown: additional && index < items.length - 1,
        itemSchema,
        itemData: itemCast,
        itemUiSchema,
        itemFieldPathId,
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

/** Type used for the state of the `ArrayField` component */
type ArrayFieldState<T> = {
  /** The hash of the last formData passed in */
  formDataHash: string;
  /** The keyed form data elements */
  keyedFormData: KeyedFormDataType<T>[];
};

/** A custom hook that handles the updating of the keyedFormData from an external `formData` change as well as
 * internally by the `ArrayField`. If there was an external `formData` change, then the `keyedFormData` is recomputed
 * in order to preserve the unique keys from the old `keyedFormData` to the new `formData`. Along with the
 * `keyedFormData` this hook also returns an `updateKeyedFormData()` function for use by the `ArrayField`. The detection
 * of external `formData` are handled by storing the hash of that `formData` along with the `keyedFormData` associated
 * with it. The `updateKeyedFormData()` will update that hash whenever the `keyedFormData` is modified and as well as
 * returning the plain `formData` from the `keyedFormData`.
 */
function useKeyedFormData<T = any>(formData: T[] = []): KeyedFormDataState<T> {
  const newHash = useMemo(() => hashObject(formData), [formData])
  const [state, setState] = useState<ArrayFieldState<T>>(() => ({
    formDataHash: newHash,
    keyedFormData: generateKeyedFormData<T>(formData),
  }));

  let { keyedFormData, formDataHash } = state;
  if (newHash !== formDataHash) {
    const nextFormData = Array.isArray(formData) ? formData : [];
    const previousKeyedFormData = keyedFormData || [];
    keyedFormData =
      nextFormData.length === previousKeyedFormData.length
        ? previousKeyedFormData.map((previousKeyedFormDatum, index) => ({
            key: previousKeyedFormDatum.key,
            item: nextFormData[index],
          }))
        : generateKeyedFormData<T>(nextFormData);
    formDataHash = newHash;
    setState({ formDataHash, keyedFormData });
  }

  const updateKeyedFormData = useCallback((newData: KeyedFormDataType<T>[]) => {
    const plainFormData = keyedToPlainFormData(newData);
    const newHash = hashObject(plainFormData);
    setState({ formDataHash: newHash, keyedFormData: newData });
    return plainFormData;
  }, []);

  return { keyedFormData, updateKeyedFormData };
}

/** The `ArrayField` component is used to render a field in the schema that is of type `array`. It supports both normal
 * and fixed array, allowing user to add and remove elements from the array data.
 */
export default function ArrayField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T[], S, F>,
) {
  const { schema, uiSchema, errorSchema, fieldPathId, registry, formData, onChange } = props;
  const { schemaUtils, translateString } = registry;
  const { keyedFormData, updateKeyedFormData } = useKeyedFormData<T>(formData);

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

      let newErrorSchema: ErrorSchema<T> | undefined;
      if (errorSchema) {
        newErrorSchema = {};
        for (const idx in errorSchema) {
          const i = parseInt(idx);
          if (index === undefined || i < index) {
            set(newErrorSchema, [i], errorSchema[idx]);
          } else if (i >= index) {
            set(newErrorSchema, [i + 1], errorSchema[idx]);
          }
        }
      }

      const newKeyedFormDataRow: KeyedFormDataType<T> = {
        key: generateRowId(),
        item: getNewFormDataRow<T, S, F>(registry, schema),
      };
      const newKeyedFormData = [...keyedFormData];
      if (index !== undefined) {
        newKeyedFormData.splice(index, 0, newKeyedFormDataRow);
      } else {
        newKeyedFormData.push(newKeyedFormDataRow);
      }
      onChange(updateKeyedFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>);
    },
    [keyedFormData, registry, schema, onChange, updateKeyedFormData, errorSchema, fieldPathId],
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

      let newErrorSchema: ErrorSchema<T> | undefined;
      if (errorSchema) {
        newErrorSchema = {};
        for (const idx in errorSchema) {
          const i = parseInt(idx);
          if (i <= index) {
            set(newErrorSchema, [i], errorSchema[idx]);
          } else if (i > index) {
            set(newErrorSchema, [i + 1], errorSchema[idx]);
          }
        }
      }

      const newKeyedFormDataRow: KeyedFormDataType<T> = {
        key: generateRowId(),
        item: cloneDeep(keyedFormData[index].item),
      };
      const newKeyedFormData = [...keyedFormData];
      if (index !== undefined) {
        newKeyedFormData.splice(index + 1, 0, newKeyedFormDataRow);
      } else {
        newKeyedFormData.push(newKeyedFormDataRow);
      }
      onChange(updateKeyedFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>);
    },
    [keyedFormData, onChange, updateKeyedFormData, errorSchema, fieldPathId],
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
      let newErrorSchema: ErrorSchema<T> | undefined;
      if (errorSchema) {
        newErrorSchema = {};
        for (const idx in errorSchema) {
          const i = parseInt(idx);
          if (i < index) {
            set(newErrorSchema, [i], errorSchema[idx]);
          } else if (i > index) {
            set(newErrorSchema, [i - 1], errorSchema[idx]);
          }
        }
      }
      const newKeyedFormData = keyedFormData.filter((_, i) => i !== index);
      onChange(updateKeyedFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>);
    },
    [keyedFormData, onChange, updateKeyedFormData, errorSchema, fieldPathId],
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
      let newErrorSchema: ErrorSchema<T> | undefined;
      if (errorSchema) {
        newErrorSchema = {};
        for (const idx in errorSchema) {
          const i = parseInt(idx);
          if (i == index) {
            set(newErrorSchema, [newIndex], errorSchema[index]);
          } else if (i == newIndex) {
            set(newErrorSchema, [index], errorSchema[newIndex]);
          } else {
            set(newErrorSchema, [idx], errorSchema[i]);
          }
        }
      }

      function reOrderArray() {
        // Copy item
        const _newKeyedFormData = keyedFormData.slice();

        // Moves item from index to newIndex
        _newKeyedFormData.splice(index, 1);
        _newKeyedFormData.splice(newIndex, 0, keyedFormData[index]);

        return _newKeyedFormData;
      }
      const newKeyedFormData = reOrderArray();
      onChange(updateKeyedFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>);
    },
    [keyedFormData, onChange, updateKeyedFormData, errorSchema, fieldPathId],
  );

  /** Callback handler used to deal with changing the value of the data in the array at the `index`. Calls the
   * `onChange` callback with the updated form data
   *
   * @param index - The index of the item being changed
   */
  const handleChange = useCallback(
    (value: any, path: FieldPathList, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      onChange(
        // We need to treat undefined items as nulls to have validation.
        // See https://github.com/tdegrunt/jsonschema/issues/206
        value === undefined ? null : value,
        path,
        newErrorSchema as ErrorSchema<T[]>,
        id,
      );
    },
    [onChange],
  );

  /** Callback handler used to change the value for a checkbox */
  const onSelectChange = useCallback(
    (value: any) => {
      onChange(value, fieldPathId.path, undefined, fieldPathId?.[ID_KEY]);
    },
    [onChange, fieldPathId],
  );

  if (!(ITEMS_KEY in schema)) {
    const uiOptions = getUiOptions<T[], S, F>(uiSchema);
    const UnsupportedFieldTemplate = getTemplate<'UnsupportedFieldTemplate', T[], S, F>(
      'UnsupportedFieldTemplate',
      registry,
      uiOptions,
    );

    return (
      <UnsupportedFieldTemplate
        schema={schema}
        fieldPathId={fieldPathId}
        reason={translateString(TranslatableString.MissingItems)}
        registry={registry}
      />
    );
  }
  const arrayProps = {
    handleAddItem,
    handleCopyItem,
    handleRemoveItem,
    handleReorderItems,
    keyedFormData,
    onChange: handleChange,
  };
  if (schemaUtils.isMultiSelect(schema)) {
    // If array has enum or uniqueItems set to true, call renderMultiSelect() to render the default multiselect widget or a custom widget, if specified.
    return <ArrayAsMultiSelect<T, S, F> {...props} onSelectChange={onSelectChange} />;
  }
  if (isCustomWidget<T[], S, F>(uiSchema)) {
    return <ArrayAsCustomWidget<T, S, F> {...props} onSelectChange={onSelectChange} />;
  }
  if (isFixedItems(schema)) {
    return <FixedArray<T, S, F> {...props} {...arrayProps} />;
  }
  if (schemaUtils.isFilesArray(schema, uiSchema)) {
    return <ArrayAsFiles {...props} onSelectChange={onSelectChange} />;
  }
  return <NormalArray<T, S, F> {...props} {...arrayProps} />;
}
