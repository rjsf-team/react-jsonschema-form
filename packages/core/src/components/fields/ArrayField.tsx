import { Component, MouseEvent } from 'react';
import {
  getTemplate,
  getWidget,
  getUiOptions,
  isFixedItems,
  allowAdditionalItems,
  isCustomWidget,
  optionsList,
  toFieldPathId,
  ArrayFieldTemplateProps,
  ErrorSchema,
  FieldPathId,
  FieldPathList,
  FieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  UiSchema,
  ITEMS_KEY,
} from '@rjsf/utils';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isObject from 'lodash/isObject';
import set from 'lodash/set';
import uniqueId from 'lodash/uniqueId';

/** Type used to represent the keyed form data used in the state */
type KeyedFormDataType<T> = { key: string; item: T };

/** Type used for the state of the `ArrayField` component */
type ArrayFieldState<T> = {
  /** The keyed form data elements */
  keyedFormData: KeyedFormDataType<T>[];
  /** Flag indicating whether any of the keyed form data has been updated */
  updatedKeyedFormData: boolean;
};

/** Used to generate a unique ID for an element in a row */
function generateRowId() {
  return uniqueId('rjsf-array-item-');
}

/** Converts the `formData` into `KeyedFormDataType` data, using the `generateRowId()` function to create the key
 *
 * @param formData - The data for the form
 * @returns - The `formData` converted into a `KeyedFormDataType` element
 */
function generateKeyedFormData<T>(formData: T[]): KeyedFormDataType<T>[] {
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

/** The `ArrayField` component is used to render a field in the schema that is of type `array`. It supports both normal
 * and fixed array, allowing user to add and remove elements from the array data.
 */
class ArrayField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> extends Component<
  FieldProps<T[], S, F>,
  ArrayFieldState<T>
> {
  /** Constructs an `ArrayField` from the `props`, generating the initial keyed data from the `formData`
   *
   * @param props - The `FieldProps` for this template
   */
  constructor(props: FieldProps<T[], S, F>) {
    super(props);
    const { formData = [] } = props;
    const keyedFormData = generateKeyedFormData<T>(formData);
    this.state = {
      keyedFormData,
      updatedKeyedFormData: false,
    };
  }

  /** React lifecycle method that is called when the props are about to change allowing the state to be updated. It
   * regenerates the keyed form data and returns it
   *
   * @param nextProps - The next set of props data
   * @param prevState - The previous set of state data
   */
  static getDerivedStateFromProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    nextProps: Readonly<FieldProps<T[], S, F>>,
    prevState: Readonly<ArrayFieldState<T>>,
  ) {
    // Don't call getDerivedStateFromProps if keyed formdata was just updated.
    if (prevState.updatedKeyedFormData) {
      return {
        updatedKeyedFormData: false,
      };
    }
    const nextFormData = Array.isArray(nextProps.formData) ? nextProps.formData : [];
    const previousKeyedFormData = prevState.keyedFormData || [];
    const newKeyedFormData =
      nextFormData.length === previousKeyedFormData.length
        ? previousKeyedFormData.map((previousKeyedFormDatum, index) => {
            return {
              key: previousKeyedFormDatum.key,
              item: nextFormData[index],
            };
          })
        : generateKeyedFormData<T>(nextFormData);
    return {
      keyedFormData: newKeyedFormData,
    };
  }

  /** Returns the appropriate title for an item by getting first the title from the schema.items, then falling back to
   * the description from the schema.items, and finally the string "Item"
   */
  get itemTitle() {
    const { schema, registry } = this.props;
    const { translateString } = registry;
    return get(
      schema,
      [ITEMS_KEY, 'title'],
      get(schema, [ITEMS_KEY, 'description'], translateString(TranslatableString.ArrayItemTitle)),
    );
  }

  /** Determines whether the item described in the schema is always required, which is determined by whether any item
   * may be null.
   *
   * @param itemSchema - The schema for the item
   * @return - True if the item schema type does not contain the "null" type
   */
  isItemRequired(itemSchema: S) {
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
   * @param formItems - The list of items in the form
   * @returns - True if the item is addable otherwise false
   */
  canAddItem(formItems: any[]) {
    const { schema, uiSchema, registry } = this.props;
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
   */
  _getNewFormDataRow = (): T => {
    const { schema, registry } = this.props;
    const { schemaUtils } = registry;
    let itemSchema = schema.items as S;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems as S;
    }
    // Cast this as a T to work around schema utils being for T[] caused by the FieldProps<T[], S, F> call on the class
    return schemaUtils.getDefaultFormState(itemSchema) as unknown as T;
  };

  /** Callback handler for when the user clicks on the add or add at index buttons. Creates a new row of keyed form data
   * either at the end of the list (when index is not specified) or inserted at the `index` when it is, adding it into
   * the state, and then returning `onChange()` with the plain form data converted from the keyed data
   *
   * @param event - The event for the click
   * @param [index] - The optional index at which to add the new data
   */
  _handleAddClick(event: MouseEvent, index?: number) {
    if (event) {
      event.preventDefault();
    }

    const { onChange, errorSchema, fieldPathId } = this.props;
    const { keyedFormData } = this.state;
    // refs #195: revalidate to ensure properly reindexing errors
    let newErrorSchema: ErrorSchema<T>;
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
      item: this._getNewFormDataRow(),
    };
    const newKeyedFormData = [...keyedFormData];
    if (index !== undefined) {
      newKeyedFormData.splice(index, 0, newKeyedFormDataRow);
    } else {
      newKeyedFormData.push(newKeyedFormDataRow);
    }
    this.setState(
      {
        keyedFormData: newKeyedFormData,
        updatedKeyedFormData: true,
      },
      // add click will pass the empty `path` array to the onChange which adds the appropriate path
      () => onChange(keyedToPlainFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>),
    );
  }

  /** Callback handler for when the user clicks on the add button. Creates a new row of keyed form data at the end of
   * the list, adding it into the state, and then returning `onChange()` with the plain form data converted from the
   * keyed data
   *
   * @param event - The event for the click
   */
  onAddClick = (event: MouseEvent) => {
    this._handleAddClick(event);
  };

  /** Callback handler for when the user clicks on the add button on an existing array element. Creates a new row of
   * keyed form data inserted at the `index`, adding it into the state, and then returning `onChange()` with the plain
   * form data converted from the keyed data
   *
   * @param index - The index at which the add button is clicked
   */
  onAddIndexClick = (index: number) => {
    return (event: MouseEvent) => {
      this._handleAddClick(event, index);
    };
  };

  /** Callback handler for when the user clicks on the copy button on an existing array element. Clones the row of
   * keyed form data at the `index` into the next position in the state, and then returning `onChange()` with the plain
   * form data converted from the keyed data
   *
   * @param index - The index at which the copy button is clicked
   */
  onCopyIndexClick = (index: number) => {
    return (event: MouseEvent) => {
      if (event) {
        event.preventDefault();
      }

      const { onChange, errorSchema, fieldPathId } = this.props;
      const { keyedFormData } = this.state;
      // refs #195: revalidate to ensure properly reindexing errors
      let newErrorSchema: ErrorSchema<T>;
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
      this.setState(
        {
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true,
        },
        () => onChange(keyedToPlainFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>),
      );
    };
  };

  /** Callback handler for when the user clicks on the remove button on an existing array element. Removes the row of
   * keyed form data at the `index` in the state, and then returning `onChange()` with the plain form data converted
   * from the keyed data
   *
   * @param index - The index at which the remove button is clicked
   */
  onDropIndexClick = (index: number) => {
    return (event: MouseEvent) => {
      if (event) {
        event.preventDefault();
      }
      const { onChange, errorSchema, fieldPathId } = this.props;
      const { keyedFormData } = this.state;
      // refs #195: revalidate to ensure properly reindexing errors
      let newErrorSchema: ErrorSchema<T>;
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
      this.setState(
        {
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true,
        },
        () => onChange(keyedToPlainFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>),
      );
    };
  };

  /** Callback handler for when the user clicks on one of the move item buttons on an existing array element. Moves the
   * row of keyed form data at the `index` to the `newIndex` in the state, and then returning `onChange()` with the
   * plain form data converted from the keyed data
   *
   * @param index - The index of the item to move
   * @param newIndex - The index to where the item is to be moved
   */
  onReorderClick = (index: number, newIndex: number) => {
    return (event: MouseEvent<HTMLButtonElement>) => {
      if (event) {
        event.preventDefault();
        event.currentTarget.blur();
      }
      const { onChange, errorSchema, fieldPathId } = this.props;
      let newErrorSchema: ErrorSchema<T>;
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

      const { keyedFormData } = this.state;
      function reOrderArray() {
        // Copy item
        const _newKeyedFormData = keyedFormData.slice();

        // Moves item from index to newIndex
        _newKeyedFormData.splice(index, 1);
        _newKeyedFormData.splice(newIndex, 0, keyedFormData[index]);

        return _newKeyedFormData;
      }
      const newKeyedFormData = reOrderArray();
      this.setState(
        {
          keyedFormData: newKeyedFormData,
        },
        () => onChange(keyedToPlainFormData(newKeyedFormData), fieldPathId.path, newErrorSchema as ErrorSchema<T[]>),
      );
    };
  };

  /** Callback handler used to deal with changing the value of the data in the array at the `index`. Calls the
   * `onChange` callback with the updated form data
   *
   * @param index - The index of the item being changed
   */
  onChangeForIndex = (index: number) => {
    return (value: any, path: FieldPathList, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      const { onChange } = this.props;
      onChange(
        // We need to treat undefined items as nulls to have validation.
        // See https://github.com/tdegrunt/jsonschema/issues/206
        value === undefined ? null : value,
        path,
        newErrorSchema as ErrorSchema<T[]>,
        id,
      );
    };
  };

  /** Callback handler used to change the value for a checkbox */
  onSelectChange = (value: any) => {
    const { onChange, fieldPathId } = this.props;
    // select change will pass an empty `path` array since the `ObjectField` will add the path value automatically
    onChange(value, fieldPathId.path, undefined, fieldPathId && fieldPathId.$id);
  };

  /** Helper method to compute item UI schema for both normal and fixed arrays
   * Handles both static object and dynamic function cases
   *
   * @param uiSchema - The parent UI schema containing items definition
   * @param item - The item data
   * @param index - The index of the item
   * @param formContext - The form context
   * @returns The computed UI schema for the item
   */
  private computeItemUiSchema(
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

  /** Renders the `ArrayField` depending on the specific needs of the schema and uischema elements
   */
  render() {
    const { schema, uiSchema, fieldPathId, registry } = this.props;
    const { schemaUtils, translateString } = registry;
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
    if (schemaUtils.isMultiSelect(schema)) {
      // If array has enum or uniqueItems set to true, call renderMultiSelect() to render the default multiselect widget or a custom widget, if specified.
      return this.renderMultiSelect();
    }
    if (isCustomWidget<T[], S, F>(uiSchema)) {
      return this.renderCustomWidget();
    }
    if (isFixedItems(schema)) {
      return this.renderFixedArray();
    }
    if (schemaUtils.isFilesArray(schema, uiSchema)) {
      return this.renderFiles();
    }
    return this.renderNormalArray();
  }

  /** Renders a normal array without any limitations of length
   */
  renderNormalArray() {
    const {
      schema,
      uiSchema = {},
      errorSchema,
      fieldPathId,
      name,
      title,
      disabled = false,
      readonly = false,
      autofocus = false,
      required = false,
      registry,
      onBlur,
      onFocus,
      rawErrors,
    } = this.props;
    const { keyedFormData } = this.state;
    const fieldTitle = schema.title || title || name;
    const { schemaUtils, formContext, globalFormOptions } = registry;
    const uiOptions = getUiOptions<T[], S, F>(uiSchema);
    const _schemaItems: S = isObject(schema.items) ? (schema.items as S) : ({} as S);
    const itemsSchema: S = schemaUtils.retrieveSchema(_schemaItems);
    const formData = keyedToPlainFormData(this.state.keyedFormData);
    const canAdd = this.canAddItem(formData);
    const arrayProps: ArrayFieldTemplateProps<T[], S, F> = {
      canAdd,
      items: keyedFormData.map((keyedItem, index) => {
        const { key, item } = keyedItem;
        // While we are actually dealing with a single item of type T, the types require a T[], so cast
        const itemCast = item as unknown as T[];
        const itemSchema = schemaUtils.retrieveSchema(_schemaItems, itemCast);
        const itemErrorSchema = errorSchema ? (errorSchema[index] as ErrorSchema<T[]>) : undefined;
        const itemFieldPathId = toFieldPathId(index, globalFormOptions, fieldPathId);

        // Compute the item UI schema using the helper method
        const itemUiSchema = this.computeItemUiSchema(uiSchema, item, index, formContext);

        return this.renderArrayFieldItem({
          key,
          index,
          name: name && `${name}-${index}`,
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
        });
      }),
      className: `rjsf-field rjsf-field-array rjsf-field-array-of-${itemsSchema.type}`,
      disabled,
      fieldPathId,
      uiSchema,
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      title: fieldTitle,
      formData,
      rawErrors,
      registry,
    };

    const Template = getTemplate<'ArrayFieldTemplate', T[], S, F>('ArrayFieldTemplate', registry, uiOptions);
    return <Template {...arrayProps} />;
  }

  /** Renders an array using the custom widget provided by the user in the `uiSchema`
   */
  renderCustomWidget() {
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
    } = this.props;
    const { widgets, formContext, globalUiOptions, schemaUtils } = registry;
    const { widget, title: uiTitle, ...options } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
    const Widget = getWidget<T[], S, F>(schema, widget, widgets);
    const label = uiTitle ?? schema.title ?? name;
    const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
    return (
      <Widget
        id={fieldPathId.$id}
        name={name}
        multiple
        onChange={this.onSelectChange}
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
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
        htmlName={fieldPathId.name}
      />
    );
  }

  /** Renders an array as a set of checkboxes
   */
  renderMultiSelect() {
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
    } = this.props;
    const { widgets, schemaUtils, formContext, globalUiOptions } = registry;
    const itemsSchema = schemaUtils.retrieveSchema(schema.items as S, items);
    const enumOptions = optionsList<T[], S, F>(itemsSchema, uiSchema);
    const { widget = 'select', title: uiTitle, ...options } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
    const Widget = getWidget<T[], S, F>(schema, widget, widgets);
    const label = uiTitle ?? schema.title ?? name;
    const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
    return (
      <Widget
        id={fieldPathId.$id}
        name={name}
        multiple
        onChange={this.onSelectChange}
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
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
        htmlName={fieldPathId.name}
      />
    );
  }

  /** Renders an array of files using the `FileWidget`
   */
  renderFiles() {
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
    } = this.props;
    const { widgets, formContext, globalUiOptions, schemaUtils } = registry;
    const { widget = 'files', title: uiTitle, ...options } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
    const Widget = getWidget<T[], S, F>(schema, widget, widgets);
    const label = uiTitle ?? schema.title ?? name;
    const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
    return (
      <Widget
        options={options}
        id={fieldPathId.$id}
        name={name}
        multiple
        onChange={this.onSelectChange}
        onBlur={onBlur}
        onFocus={onFocus}
        schema={schema}
        uiSchema={uiSchema}
        value={items}
        disabled={disabled}
        readonly={readonly}
        required={required}
        registry={registry}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
        label={label}
        hideLabel={!displayLabel}
        htmlName={fieldPathId.name}
      />
    );
  }

  /** Renders an array that has a maximum limit of items
   */
  renderFixedArray() {
    const {
      schema,
      uiSchema = {},
      formData = [],
      errorSchema,
      fieldPathId,
      name,
      title,
      disabled = false,
      readonly = false,
      autofocus = false,
      required = false,
      registry,
      onBlur,
      onFocus,
      rawErrors,
    } = this.props;
    const { keyedFormData } = this.state;
    let { formData: items = [] } = this.props;
    const fieldTitle = schema.title || title || name;
    const uiOptions = getUiOptions<T[], S, F>(uiSchema);
    const { schemaUtils, formContext, globalFormOptions } = registry;
    const _schemaItems: S[] = isObject(schema.items) ? (schema.items as S[]) : ([] as S[]);
    const itemSchemas = _schemaItems.map((item: S, index: number) =>
      schemaUtils.retrieveSchema(item, formData[index] as unknown as T[]),
    );
    const additionalSchema = isObject(schema.additionalItems)
      ? schemaUtils.retrieveSchema(schema.additionalItems as S, formData)
      : null;

    if (!items || items.length < itemSchemas.length) {
      // to make sure at least all fixed items are generated
      items = items || [];
      items = items.concat(new Array(itemSchemas.length - items.length));
    }

    // These are the props passed into the render function
    const canAdd = this.canAddItem(items) && !!additionalSchema;
    const arrayProps: ArrayFieldTemplateProps<T[], S, F> = {
      canAdd,
      className: 'rjsf-field rjsf-field-array rjsf-field-array-fixed-items',
      disabled,
      fieldPathId,
      formData,
      items: keyedFormData.map((keyedItem, index) => {
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
            itemUiSchema = this.computeItemUiSchema(uiSchema, item, index, formContext);
          }
        }
        const itemErrorSchema = errorSchema ? (errorSchema[index] as ErrorSchema<T[]>) : undefined;

        return this.renderArrayFieldItem({
          key,
          index,
          name: name && `${name}-${index}`,
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
        });
      }),
      onAddClick: this.onAddClick,
      readonly,
      required,
      registry,
      schema,
      uiSchema,
      title: fieldTitle,
      errorSchema,
      rawErrors,
    };

    const Template = getTemplate<'ArrayFieldTemplate', T[], S, F>('ArrayFieldTemplate', registry, uiOptions);
    return <Template {...arrayProps} />;
  }

  /** Renders the individual array item using a `SchemaField` along with the additional properties required to be send
   * back to the `ArrayFieldItemTemplate`.
   *
   * @param props - The props for the individual array item to be rendered
   */
  renderArrayFieldItem(props: {
    key: string;
    index: number;
    name: string;
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
    rawErrors?: string[];
    totalItems: number;
  }) {
    const {
      key,
      index,
      name,
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
      rawErrors,
      totalItems,
      title,
    } = props;
    const { disabled, hideError, readonly, uiSchema, registry, formContext } = this.props;
    const {
      fields: { ArraySchemaField, SchemaField },
      globalUiOptions,
    } = registry;
    const ItemSchemaField = ArraySchemaField || SchemaField;
    const { orderable = true, removable = true, copyable = false } = getUiOptions<T[], S, F>(uiSchema, globalUiOptions);
    const has: { [key: string]: boolean } = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      copy: copyable && canAdd,
      remove: removable && canRemove,
      toolbar: false,
    };
    has.toolbar = Object.keys(has).some((key: keyof typeof has) => has[key]);

    return {
      children: (
        <ItemSchemaField
          name={name}
          title={title}
          index={index}
          schema={itemSchema}
          uiSchema={itemUiSchema}
          formData={itemData}
          formContext={formContext}
          errorSchema={itemErrorSchema}
          fieldPathId={itemFieldPathId}
          required={this.isItemRequired(itemSchema)}
          onChange={this.onChangeForIndex(index)}
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
        fieldPathId: itemFieldPathId,
        disabled: disabled,
        readonly: readonly,
        canAdd,
        hasCopy: has.copy,
        hasMoveUp: has.moveUp,
        hasMoveDown: has.moveDown,
        hasRemove: has.remove,
        index: index,
        totalItems: totalItems,
        onAddIndexClick: this.onAddIndexClick,
        onCopyIndexClick: this.onCopyIndexClick,
        onDropIndexClick: this.onDropIndexClick,
        onReorderClick: this.onReorderClick,
        registry: registry,
        schema: itemSchema,
        uiSchema: itemUiSchema,
      },
      className: 'rjsf-array-item',
      disabled,
      hasToolbar: has.toolbar,
      index,
      totalItems,
      key,
      readonly,
      registry,
      schema: itemSchema,
      uiSchema: itemUiSchema,
    };
  }
}

/** `ArrayField` is `React.ComponentType<FieldProps<T[], S, F>>` (necessarily) but the `registry` requires things to be a
 * `Field` which is defined as `React.ComponentType<FieldProps<T, S, F>>`, so cast it to make `registry` happy.
 */
export default ArrayField;
