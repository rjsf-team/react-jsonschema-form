import React, { Component } from "react";
import PropTypes from "prop-types";

import UnsupportedField from "./UnsupportedField";
import {
  getWidget,
  getDefaultFormState,
  getUiOptions,
  isMultiSelect,
  isFilesArray,
  isFixedItems,
  allowAdditionalItems,
  optionsList,
  retrieveSchema,
  toIdSchema,
  getDefaultRegistry,
} from "../../utils";

function ArrayFieldTitle({ TitleField, idSchema, title, required }) {
  if (!title) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
}

function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
}

function IconBtn(props) {
  const { type = "default", icon, className, ...otherProps } = props;
  return (
    <button
      type="button"
      className={`btn btn-${type} ${className}`}
      {...otherProps}>
      <i className={`glyphicon glyphicon-${icon}`} />
    </button>
  );
}

// Used in the two templates
function DefaultArrayItem(props) {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };
  return (
    <div key={props.index} className={props.className}>
      <div className={props.hasToolbar ? "col-xs-9" : "col-xs-12"}>
        {props.children}
      </div>

      {props.hasToolbar && (
        <div className="col-xs-3 array-item-toolbox">
          <div
            className="btn-group"
            style={{ display: "flex", justifyContent: "space-around" }}>
            {(props.hasMoveUp || props.hasMoveDown) && (
              <IconBtn
                icon="arrow-up"
                className="array-item-move-up"
                tabIndex="-1"
                style={btnStyle}
                disabled={props.disabled || props.readonly || !props.hasMoveUp}
                onClick={props.onReorderClick(props.index, props.index - 1)}
              />
            )}

            {(props.hasMoveUp || props.hasMoveDown) && (
              <IconBtn
                icon="arrow-down"
                className="array-item-move-down"
                tabIndex="-1"
                style={btnStyle}
                disabled={
                  props.disabled || props.readonly || !props.hasMoveDown
                }
                onClick={props.onReorderClick(props.index, props.index + 1)}
              />
            )}

            {props.hasRemove && (
              <IconBtn
                type="danger"
                icon="remove"
                className="array-item-remove"
                tabIndex="-1"
                style={btnStyle}
                disabled={props.disabled || props.readonly}
                onClick={props.onDropIndexClick(props.index)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DefaultFixedArrayFieldTemplate(props) {
  return (
    <fieldset className={props.className}>
      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.uiSchema["ui:title"] || props.title}
        required={props.required}
      />

      {(props.uiSchema["ui:description"] || props.schema.description) && (
        <div
          className="field-description"
          key={`field-description-${props.idSchema.$id}`}>
          {props.uiSchema["ui:description"] || props.schema.description}
        </div>
      )}

      <div
        className="row array-item-list"
        key={`array-item-list-${props.idSchema.$id}`}>
        {props.items && props.items.map(DefaultArrayItem)}
      </div>

      {props.canAdd && (
        <AddButton
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
}

function DefaultNormalArrayFieldTemplate(props) {
  return (
    <fieldset className={props.className}>
      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.uiSchema["ui:title"] || props.title}
        required={props.required}
      />

      {(props.uiSchema["ui:description"] || props.schema.description) && (
        <ArrayFieldDescription
          key={`array-field-description-${props.idSchema.$id}`}
          DescriptionField={props.DescriptionField}
          idSchema={props.idSchema}
          description={
            props.uiSchema["ui:description"] || props.schema.description
          }
        />
      )}

      <div
        className="row array-item-list"
        key={`array-item-list-${props.idSchema.$id}`}>
        {props.items && props.items.map(p => DefaultArrayItem(p))}
      </div>

      {props.canAdd && (
        <AddButton
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
}

class ArrayField extends Component {
  static defaultProps = {
    uiSchema: {},
    formData: [],
    idSchema: {},
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
  };

  get itemTitle() {
    const { schema } = this.props;
    return schema.items.title || schema.items.description || "Item";
  }

  isItemRequired(itemSchema) {
    if (Array.isArray(itemSchema.type)) {
      // While we don't yet support composite/nullable jsonschema types, it's
      // future-proof to check for requirement against these.
      return !itemSchema.type.includes("null");
    }
    // All non-null array item types are inherently required by design
    return itemSchema.type !== "null";
  }

  canAddItem(formItems) {
    const { schema, uiSchema } = this.props;
    let { addable } = getUiOptions(uiSchema);
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

  onAddClick = event => {
    event.preventDefault();
    const { schema, formData, registry = getDefaultRegistry() } = this.props;
    const { definitions } = registry;
    let itemSchema = schema.items;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems;
    }
    this.props.onChange([
      ...formData,
      getDefaultFormState(itemSchema, undefined, definitions),
    ]);
  };

  onDropIndexClick = index => {
    return event => {
      if (event) {
        event.preventDefault();
      }
      const { formData, onChange } = this.props;
      // refs #195: revalidate to ensure properly reindexing errors
      let newErrorSchema;
      if (this.props.errorSchema) {
        newErrorSchema = {};
        const errorSchema = this.props.errorSchema;
        for (let i in errorSchema) {
          i = parseInt(i);
          if (i < index) {
            newErrorSchema[i] = errorSchema[i];
          } else if (i > index) {
            newErrorSchema[i - 1] = errorSchema[i];
          }
        }
      }
      onChange(formData.filter((_, i) => i !== index), newErrorSchema);
    };
  };

  onReorderClick = (index, newIndex) => {
    return event => {
      if (event) {
        event.preventDefault();
        event.target.blur();
      }
      const { formData, onChange } = this.props;
      let newErrorSchema;
      if (this.props.errorSchema) {
        newErrorSchema = {};
        const errorSchema = this.props.errorSchema;
        for (let i in errorSchema) {
          if (i == index) {
            newErrorSchema[newIndex] = errorSchema[index];
          } else if (i == newIndex) {
            newErrorSchema[index] = errorSchema[newIndex];
          } else {
            newErrorSchema[i] = errorSchema[i];
          }
        }
      }
      onChange(
        formData.map((item, i) => {
          // i is string, index and newIndex are numbers,
          // so using "==" to compare
          if (i == newIndex) {
            return formData[index];
          } else if (i == index) {
            return formData[newIndex];
          } else {
            return item;
          }
        }),
        newErrorSchema
      );
    };
  };

  onChangeForIndex = index => {
    return (value, errorSchema) => {
      const { formData, onChange } = this.props;
      const newFormData = formData.map((item, i) => {
        // We need to treat undefined items as nulls to have validation.
        // See https://github.com/tdegrunt/jsonschema/issues/206
        const jsonValue = typeof value === "undefined" ? null : value;
        return index === i ? jsonValue : item;
      });
      onChange(
        newFormData,
        errorSchema &&
          this.props.errorSchema && {
            ...this.props.errorSchema,
            [index]: errorSchema,
          }
      );
    };
  };

  onSelectChange = value => {
    this.props.onChange(value);
  };

  render() {
    const {
      schema,
      uiSchema,
      idSchema,
      registry = getDefaultRegistry(),
    } = this.props;
    const { definitions } = registry;
    if (!schema.hasOwnProperty("items")) {
      return (
        <UnsupportedField
          schema={schema}
          idSchema={idSchema}
          reason="Missing items definition"
        />
      );
    }
    if (isFixedItems(schema)) {
      return this.renderFixedArray();
    }
    if (isFilesArray(schema, uiSchema, definitions)) {
      return this.renderFiles();
    }
    if (isMultiSelect(schema, definitions)) {
      return this.renderMultiSelect();
    }
    return this.renderNormalArray();
  }

  renderNormalArray() {
    const {
      schema,
      uiSchema,
      formData,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
      registry = getDefaultRegistry(),
      onBlur,
      onFocus,
      idPrefix,
    } = this.props;
    const title = schema.title === undefined ? name : schema.title;
    const { ArrayFieldTemplate, definitions, fields, formContext } = registry;
    const { TitleField, DescriptionField } = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    const arrayProps = {
      canAdd: this.canAddItem(formData),
      items: formData.map((item, index) => {
        const itemSchema = retrieveSchema(schema.items, definitions, item);
        const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
        const itemIdPrefix = idSchema.$id + "_" + index;
        const itemIdSchema = toIdSchema(
          itemSchema,
          itemIdPrefix,
          definitions,
          item,
          idPrefix
        );
        return this.renderArrayFieldItem({
          index,
          canMoveUp: index > 0,
          canMoveDown: index < formData.length - 1,
          itemSchema: itemSchema,
          itemIdSchema,
          itemErrorSchema,
          itemData: item,
          itemUiSchema: uiSchema.items,
          autofocus: autofocus && index === 0,
          onBlur,
          onFocus,
        });
      }),
      className: `field field-array field-array-of-${itemsSchema.type}`,
      DescriptionField,
      disabled,
      idSchema,
      uiSchema,
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      title,
      TitleField,
      formContext,
      formData,
    };

    // Check if a custom render function was passed in
    const Component = ArrayFieldTemplate || DefaultNormalArrayFieldTemplate;
    return <Component {...arrayProps} />;
  }

  renderMultiSelect() {
    const {
      schema,
      idSchema,
      uiSchema,
      formData,
      disabled,
      readonly,
      autofocus,
      onBlur,
      onFocus,
      registry = getDefaultRegistry(),
    } = this.props;
    const items = this.props.formData;
    const { widgets, definitions, formContext } = registry;
    const itemsSchema = retrieveSchema(schema.items, definitions, formData);
    const enumOptions = optionsList(itemsSchema);
    const { widget = "select", ...options } = {
      ...getUiOptions(uiSchema),
      enumOptions,
    };
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        onBlur={onBlur}
        onFocus={onFocus}
        options={options}
        schema={schema}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
      />
    );
  }

  renderFiles() {
    const {
      schema,
      uiSchema,
      idSchema,
      name,
      disabled,
      readonly,
      autofocus,
      onBlur,
      onFocus,
      registry = getDefaultRegistry(),
    } = this.props;
    const title = schema.title || name;
    const items = this.props.formData;
    const { widgets, formContext } = registry;
    const { widget = "files", ...options } = getUiOptions(uiSchema);
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        options={options}
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        onBlur={onBlur}
        onFocus={onFocus}
        schema={schema}
        title={title}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
      />
    );
  }

  renderFixedArray() {
    const {
      schema,
      uiSchema,
      formData,
      errorSchema,
      idPrefix,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
      registry = getDefaultRegistry(),
      onBlur,
      onFocus,
    } = this.props;
    const title = schema.title || name;
    let items = this.props.formData;
    const { ArrayFieldTemplate, definitions, fields, formContext } = registry;
    const { TitleField } = fields;
    const itemSchemas = schema.items.map((item, index) =>
      retrieveSchema(item, definitions, formData[index])
    );
    const additionalSchema = allowAdditionalItems(schema)
      ? retrieveSchema(schema.additionalItems, definitions, formData)
      : null;

    if (!items || items.length < itemSchemas.length) {
      // to make sure at least all fixed items are generated
      items = items || [];
      items = items.concat(new Array(itemSchemas.length - items.length));
    }

    // These are the props passed into the render function
    const arrayProps = {
      canAdd: this.canAddItem(items) && additionalSchema,
      className: "field field-array field-array-fixed-items",
      disabled,
      idSchema,
      formData,
      items: items.map((item, index) => {
        const additional = index >= itemSchemas.length;
        const itemSchema = additional
          ? retrieveSchema(schema.additionalItems, definitions, item)
          : itemSchemas[index];
        const itemIdPrefix = idSchema.$id + "_" + index;
        const itemIdSchema = toIdSchema(
          itemSchema,
          itemIdPrefix,
          definitions,
          item,
          idPrefix
        );
        const itemUiSchema = additional
          ? uiSchema.additionalItems || {}
          : Array.isArray(uiSchema.items)
            ? uiSchema.items[index]
            : uiSchema.items || {};
        const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;

        return this.renderArrayFieldItem({
          index,
          canRemove: additional,
          canMoveUp: index >= itemSchemas.length + 1,
          canMoveDown: additional && index < items.length - 1,
          itemSchema,
          itemData: item,
          itemUiSchema,
          itemIdSchema,
          itemErrorSchema,
          autofocus: autofocus && index === 0,
          onBlur,
          onFocus,
        });
      }),
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      uiSchema,
      title,
      TitleField,
      formContext,
    };

    // Check if a custom template template was passed in
    const Template = ArrayFieldTemplate || DefaultFixedArrayFieldTemplate;
    return <Template {...arrayProps} />;
  }

  renderArrayFieldItem(props) {
    const {
      index,
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
    } = props;
    const {
      disabled,
      readonly,
      uiSchema,
      registry = getDefaultRegistry(),
    } = this.props;
    const { fields: { SchemaField } } = registry;
    const { orderable, removable } = {
      orderable: true,
      removable: true,
      ...uiSchema["ui:options"],
    };
    const has = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      remove: removable && canRemove,
    };
    has.toolbar = Object.keys(has).some(key => has[key]);

    return {
      children: (
        <SchemaField
          schema={itemSchema}
          uiSchema={itemUiSchema}
          formData={itemData}
          errorSchema={itemErrorSchema}
          idSchema={itemIdSchema}
          required={this.isItemRequired(itemSchema)}
          onChange={this.onChangeForIndex(index)}
          onBlur={onBlur}
          onFocus={onFocus}
          registry={this.props.registry}
          disabled={this.props.disabled}
          readonly={this.props.readonly}
          autofocus={autofocus}
        />
      ),
      className: "array-item",
      disabled,
      hasToolbar: has.toolbar,
      hasMoveUp: has.moveUp,
      hasMoveDown: has.moveDown,
      hasRemove: has.remove,
      index,
      onDropIndexClick: this.onDropIndexClick,
      onReorderClick: this.onReorderClick,
      readonly,
    };
  }
}

function AddButton({ onClick, disabled }) {
  return (
    <div className="row">
      <p className="col-xs-3 col-xs-offset-9 array-item-add text-right">
        <IconBtn
          type="info"
          icon="plus"
          className="btn-add col-xs-12"
          tabIndex="0"
          onClick={onClick}
          disabled={disabled}
        />
      </p>
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.shape({
      "ui:options": PropTypes.shape({
        addable: PropTypes.bool,
        orderable: PropTypes.bool,
        removable: PropTypes.bool,
      }),
    }),
    idSchema: PropTypes.object,
    errorSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    formData: PropTypes.array,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      formContext: PropTypes.object.isRequired,
    }),
  };
}

export default ArrayField;
