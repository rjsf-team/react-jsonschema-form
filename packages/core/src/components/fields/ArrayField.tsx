import React, { Component } from "react";
import {
  getTemplate,
  getWidget,
  getUiOptions,
  isFixedItems,
  allowAdditionalItems,
  isCustomWidget,
  optionsList,
  ArrayFieldTemplateProps,
  ErrorSchema,
  Field,
  FieldProps,
  IdSchema,
  RJSFSchema,
  UiSchema,
  ITEMS_KEY,
} from "@rjsf/utils";
import get from "lodash/get";
import isObject from "lodash/isObject";
import set from "lodash/set";
import { nanoid } from "nanoid";

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
  return nanoid();
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
function keyedToPlainFormData<T>(
  keyedFormData: KeyedFormDataType<T> | KeyedFormDataType<T>[]
): T[] {
  if (Array.isArray(keyedFormData)) {
    return keyedFormData.map((keyedItem) => keyedItem.item);
  }
  return [];
}

/** The `ArrayField` component is used to render a field in the schema that is of type `array`. It supports both normal
 * and fixed array, allowing user to add and remove elements from the array data.
 */
class ArrayField<T = any, F = any> extends Component<
  FieldProps<T[], F>,
  ArrayFieldState<T>
> {
  /** Constructs an `ArrayField` from the `props`, generating the initial keyed data from the `formData`
   *
   * @param props - The `FieldProps` for this template
   */
  constructor(props: FieldProps<T[], F>) {
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
  static getDerivedStateFromProps<T = any, F = any>(
    nextProps: Readonly<FieldProps<T[], F>>,
    prevState: Readonly<ArrayFieldState<T>>
  ) {
    // Don't call getDerivedStateFromProps if keyed formdata was just updated.
    if (prevState.updatedKeyedFormData) {
      return {
        updatedKeyedFormData: false,
      };
    }
    const nextFormData = Array.isArray(nextProps.formData)
      ? nextProps.formData
      : [];
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
    const { schema } = this.props;
    return get(
      schema,
      [ITEMS_KEY, "title"],
      get(schema, [ITEMS_KEY, "description"], "Item")
    );
  }

  /** Determines whether the item described in the schema is always required, which is determined by whether any item
   * may be null.
   *
   * @param itemSchema - The schema for the item
   * @return - True if the item schema type does not contain the "null" type
   */
  isItemRequired(itemSchema: RJSFSchema) {
    if (Array.isArray(itemSchema.type)) {
      // While we don't yet support composite/nullable jsonschema types, it's
      // future-proof to check for requirement against these.
      return !itemSchema.type.includes("null");
    }
    // All non-null array item types are inherently required by design
    return itemSchema.type !== "null";
  }

  /** Determines whether more items can be added to the array. If the uiSchema indicates the array doesn't allow adding
   * then false is returned. Otherwise, if the schema indicates that there are a maximum number of items and the
   * `formData` matches that value, then false is returned, otherwise true is returned.
   *
   * @param formItems - The list of items in the form
   * @returns - True if the item is addable otherwise false
   */
  canAddItem(formItems: any[]) {
    const { schema, uiSchema } = this.props;
    let { addable } = getUiOptions<T[], F>(uiSchema);
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
    let itemSchema = schema.items as RJSFSchema;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems as RJSFSchema;
    }
    // Cast this as a T to work around schema utils being for T[] caused by the FieldProps<T[], F> call on the class
    return schemaUtils.getDefaultFormState(itemSchema) as unknown as T;
  };

  /** Callback handler for when the user clicks on the add button. Creates a new row of keyed form data at the end of
   * the list, adding it into the state, and then returning `onChange()` with the plain form data converted from the
   * keyed data
   *
   * @param event - The event for the click
   */
  onAddClick = (event: MouseEvent) => {
    if (event) {
      event.preventDefault();
    }

    const { onChange } = this.props;
    const { keyedFormData } = this.state;
    const newKeyedFormDataRow: KeyedFormDataType<T> = {
      key: generateRowId(),
      item: this._getNewFormDataRow(),
    };
    const newKeyedFormData = [...keyedFormData, newKeyedFormDataRow];
    this.setState(
      {
        keyedFormData: newKeyedFormData,
        updatedKeyedFormData: true,
      },
      () => onChange(keyedToPlainFormData(newKeyedFormData))
    );
  };

  /** Callback handler for when the user clicks on the add button on an existing array element. Creates a new row of
   * keyed form data inserted at the `index`, adding it into the state, and then returning `onChange()` with the plain
   * form data converted from the keyed data
   *
   * @param index - The index at which the add button is clicked
   */
  onAddIndexClick = (index: number) => {
    return (event: MouseEvent) => {
      if (event) {
        event.preventDefault();
      }
      const { onChange } = this.props;
      const { keyedFormData } = this.state;
      const newKeyedFormDataRow: KeyedFormDataType<T> = {
        key: generateRowId(),
        item: this._getNewFormDataRow(),
      };
      const newKeyedFormData = [...keyedFormData];
      newKeyedFormData.splice(index, 0, newKeyedFormDataRow);

      this.setState(
        {
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true,
        },
        () => onChange(keyedToPlainFormData(newKeyedFormData))
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
      const { onChange, errorSchema } = this.props;
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
        () =>
          onChange(
            keyedToPlainFormData(newKeyedFormData),
            newErrorSchema as ErrorSchema<T[]>
          )
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
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event) {
        event.preventDefault();
        event.currentTarget.blur();
      }
      const { onChange, errorSchema } = this.props;
      let newErrorSchema: ErrorSchema<T>;
      if (this.props.errorSchema) {
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
        () =>
          onChange(
            keyedToPlainFormData(newKeyedFormData),
            newErrorSchema as ErrorSchema<T[]>
          )
      );
    };
  };

  /** Callback handler used to deal with changing the value of the data in the array at the `index`. Calls the
   * `onChange` callback with the updated form data
   *
   * @param index - The index of the item being changed
   */
  onChangeForIndex = (index: number) => {
    return (value: any, newErrorSchema?: ErrorSchema<T>) => {
      const { formData, onChange, errorSchema } = this.props;
      const arrayData = Array.isArray(formData) ? formData : [];
      const newFormData = arrayData.map((item: T, i: number) => {
        // We need to treat undefined items as nulls to have validation.
        // See https://github.com/tdegrunt/jsonschema/issues/206
        const jsonValue = typeof value === "undefined" ? null : value;
        return index === i ? jsonValue : item;
      });
      onChange(
        newFormData,
        errorSchema &&
          errorSchema && {
            ...errorSchema,
            [index]: newErrorSchema,
          }
      );
    };
  };

  /** Callback handler used to change the value for a checkbox */
  onSelectChange = (value: any) => {
    const { onChange } = this.props;
    onChange(value);
  };

  /** Renders the `ArrayField` depending on the specific needs of the schema and uischema elements
   */
  render() {
    const { schema, uiSchema, idSchema, registry } = this.props;
    const { schemaUtils } = registry;
    if (!(ITEMS_KEY in schema)) {
      const uiOptions = getUiOptions<T[], F>(uiSchema);
      const UnsupportedFieldTemplate = getTemplate<
        "UnsupportedFieldTemplate",
        T[],
        F
      >("UnsupportedFieldTemplate", registry, uiOptions);

      return (
        <UnsupportedFieldTemplate
          schema={schema}
          idSchema={idSchema}
          reason="Missing items definition"
          registry={registry}
        />
      );
    }
    if (schemaUtils.isMultiSelect(schema)) {
      // If array has enum or uniqueItems set to true, call renderMultiSelect() to render the default multiselect widget or a custom widget, if specified.
      return this.renderMultiSelect();
    }
    if (isCustomWidget<T[], F>(uiSchema)) {
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
      idSchema,
      name,
      disabled = false,
      readonly = false,
      autofocus = false,
      required = false,
      registry,
      onBlur,
      onFocus,
      idPrefix,
      idSeparator = "_",
      rawErrors,
    } = this.props;
    const { keyedFormData } = this.state;
    const title = schema.title === undefined ? name : schema.title;
    const { schemaUtils, formContext } = registry;
    const uiOptions = getUiOptions<T[], F>(uiSchema);
    const _schemaItems = isObject(schema.items)
      ? (schema.items as RJSFSchema)
      : {};
    const itemsSchema = schemaUtils.retrieveSchema(_schemaItems);
    const formData = keyedToPlainFormData(this.state.keyedFormData);
    const arrayProps: ArrayFieldTemplateProps<T[], F> = {
      canAdd: this.canAddItem(formData),
      items: keyedFormData.map((keyedItem, index) => {
        const { key, item } = keyedItem;
        // While we are actually dealing with a single item of type T, the types require a T[], so cast
        const itemCast = item as unknown as T[];
        const itemSchema = schemaUtils.retrieveSchema(_schemaItems, itemCast);
        const itemErrorSchema = errorSchema
          ? (errorSchema[index] as ErrorSchema<T[]>)
          : undefined;
        const itemIdPrefix = idSchema.$id + idSeparator + index;
        const itemIdSchema = schemaUtils.toIdSchema(
          itemSchema,
          itemIdPrefix,
          itemCast,
          idPrefix,
          idSeparator
        );
        return this.renderArrayFieldItem({
          key,
          index,
          name: name && `${name}-${index}`,
          canMoveUp: index > 0,
          canMoveDown: index < formData.length - 1,
          itemSchema: itemSchema,
          itemIdSchema,
          itemErrorSchema,
          itemData: itemCast,
          itemUiSchema: uiSchema.items,
          autofocus: autofocus && index === 0,
          onBlur,
          onFocus,
          rawErrors,
        });
      }),
      className: `field field-array field-array-of-${itemsSchema.type}`,
      disabled,
      idSchema,
      uiSchema,
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      title,
      formContext,
      formData,
      rawErrors,
      registry,
    };

    const Template = getTemplate<"ArrayFieldTemplate", T[], F>(
      "ArrayFieldTemplate",
      registry,
      uiOptions
    );
    return <Template {...arrayProps} />;
  }

  /** Renders an array using the custom widget provided by the user in the `uiSchema`
   */
  renderCustomWidget() {
    const {
      schema,
      idSchema,
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
    const { widgets, formContext } = registry;
    const title = schema.title || name;

    const { widget, ...options } = getUiOptions<T[], F>(uiSchema);
    const Widget = getWidget<T[], F>(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
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
        label={title}
        placeholder={placeholder}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
      />
    );
  }

  /** Renders an array as a set of checkboxes
   */
  renderMultiSelect() {
    const {
      schema,
      idSchema,
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
    const { widgets, schemaUtils, formContext } = registry;
    const itemsSchema = schemaUtils.retrieveSchema(
      schema.items as RJSFSchema,
      items
    );
    const title = schema.title || name;
    const enumOptions = optionsList(itemsSchema);
    const { widget = "select", ...options } = getUiOptions<T[], F>(uiSchema);
    const Widget = getWidget<T[], F>(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
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
        label={title}
        placeholder={placeholder}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
      />
    );
  }

  /** Renders an array of files using the `FileWidget`
   */
  renderFiles() {
    const {
      schema,
      uiSchema,
      idSchema,
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
    const title = schema.title || name;
    const { widgets, formContext } = registry;
    const { widget = "files", ...options } = getUiOptions<T[], F>(uiSchema);
    const Widget = getWidget<T[], F>(schema, widget, widgets);
    return (
      <Widget
        options={options}
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        onBlur={onBlur}
        onFocus={onFocus}
        schema={schema}
        uiSchema={uiSchema}
        title={title}
        value={items}
        disabled={disabled}
        readonly={readonly}
        required={required}
        registry={registry}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
        label=""
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
      idPrefix,
      idSeparator = "_",
      idSchema,
      name,
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
    const title = schema.title || name;
    const uiOptions = getUiOptions<T[], F>(uiSchema);
    const { schemaUtils, formContext } = registry;
    const _schemaItems = isObject(schema.items)
      ? (schema.items as RJSFSchema[])
      : [];
    const itemSchemas = _schemaItems.map((item: RJSFSchema, index: number) =>
      schemaUtils.retrieveSchema(item, formData[index] as unknown as T[])
    );
    const additionalSchema = isObject(schema.additionalItems)
      ? schemaUtils.retrieveSchema(schema.additionalItems, formData)
      : null;

    if (!items || items.length < itemSchemas.length) {
      // to make sure at least all fixed items are generated
      items = items || [];
      items = items.concat(new Array(itemSchemas.length - items.length));
    }

    // These are the props passed into the render function
    const arrayProps: ArrayFieldTemplateProps<T[], F> = {
      canAdd: this.canAddItem(items) && !!additionalSchema,
      className: "field field-array field-array-fixed-items",
      disabled,
      idSchema,
      formData,
      items: keyedFormData.map((keyedItem, index) => {
        const { key, item } = keyedItem;
        // While we are actually dealing with a single item of type T, the types require a T[], so cast
        const itemCast = item as unknown as T[];
        const additional = index >= itemSchemas.length;
        const itemSchema =
          additional && isObject(schema.additionalItems)
            ? schemaUtils.retrieveSchema(schema.additionalItems, itemCast)
            : itemSchemas[index];
        const itemIdPrefix = idSchema.$id + idSeparator + index;
        const itemIdSchema = schemaUtils.toIdSchema(
          itemSchema,
          itemIdPrefix,
          itemCast,
          idPrefix,
          idSeparator
        );
        const itemUiSchema = additional
          ? uiSchema.additionalItems || {}
          : Array.isArray(uiSchema.items)
          ? uiSchema.items[index]
          : uiSchema.items || {};
        const itemErrorSchema = errorSchema
          ? (errorSchema[index] as ErrorSchema<T[]>)
          : undefined;

        return this.renderArrayFieldItem({
          key,
          index,
          name: name && `${name}-${index}`,
          canRemove: additional,
          canMoveUp: index >= itemSchemas.length + 1,
          canMoveDown: additional && index < items.length - 1,
          itemSchema,
          itemData: itemCast,
          itemUiSchema,
          itemIdSchema,
          itemErrorSchema,
          autofocus: autofocus && index === 0,
          onBlur,
          onFocus,
          rawErrors,
        });
      }),
      onAddClick: this.onAddClick,
      readonly,
      required,
      registry,
      schema,
      uiSchema,
      title,
      formContext,
      rawErrors,
    };

    const Template = getTemplate<"ArrayFieldTemplate", T[], F>(
      "ArrayFieldTemplate",
      registry,
      uiOptions
    );
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
    canRemove?: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    itemSchema: RJSFSchema;
    itemData: T[];
    itemUiSchema: UiSchema<T[], F>;
    itemIdSchema: IdSchema<T[]>;
    itemErrorSchema?: ErrorSchema<T[]>;
    autofocus?: boolean;
    onBlur: FieldProps<T[], F>["onBlur"];
    onFocus: FieldProps<T[], F>["onFocus"];
    rawErrors?: string[];
  }) {
    const {
      key,
      index,
      name,
      canRemove = true,
      canMoveUp = true,
      canMoveDown = true,
      itemSchema,
      itemData,
      itemUiSchema,
      itemIdSchema,
      itemErrorSchema,
      autofocus,
      onBlur,
      onFocus,
      rawErrors,
    } = props;
    const {
      disabled,
      hideError,
      idPrefix,
      idSeparator,
      readonly,
      uiSchema,
      registry,
      formContext,
    } = this.props;
    const {
      fields: { SchemaField },
    } = registry;
    const { orderable = true, removable = true } = getUiOptions<T[], F>(
      uiSchema
    );
    const has: { [key: string]: boolean } = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      remove: removable && canRemove,
      toolbar: false,
    };
    has.toolbar = Object.keys(has).some((key: keyof typeof has) => has[key]);

    return {
      children: (
        <SchemaField
          name={name}
          index={index}
          schema={itemSchema}
          uiSchema={itemUiSchema}
          formData={itemData}
          formContext={formContext}
          errorSchema={itemErrorSchema}
          idPrefix={idPrefix}
          idSeparator={idSeparator}
          idSchema={itemIdSchema}
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
      className: "array-item",
      disabled,
      hasToolbar: has.toolbar,
      hasMoveUp: has.moveUp,
      hasMoveDown: has.moveDown,
      hasRemove: has.remove,
      index,
      key,
      onAddIndexClick: this.onAddIndexClick,
      onDropIndexClick: this.onDropIndexClick,
      onReorderClick: this.onReorderClick,
      readonly,
      registry,
    };
  }
}

/** `ArrayField` is `React.ComponentType<FieldProps<T[], F>>` (necessarily) but the `registry` requires things to be a
 * `Field` which is defined as `React.ComponentType<FieldProps<T, F>>`, so cast it to make `registry` happy.
 */
export default ArrayField as unknown as Field;
