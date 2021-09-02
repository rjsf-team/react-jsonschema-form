import AddButton from "../AddButton";
import IconButton from "../IconButton";
import Confirmation from "../Confirmation";
import React, { Component } from "react";
import { polyfill } from "react-lifecycles-compat";
import includes from "core-js/library/fn/array/includes";
import * as types from "../../types";
import findIndex from "lodash.findindex";
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
import shortid from "shortid";

function ArrayFieldTitle({ TitleField, idSchema, title, required }) {
  if (!title) {
    return null;
  }
  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
}
function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
  if (!description) {
    return null;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
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
    <div key={props.key} className={props.className}>
      <div className="row">


        {props.hasToolbar && (
          <div className={"col-12"}>
            <div className="array-item-toolbox float-right">
              <div
                className="btn-group"
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                }}>
                {(props.hasMoveUp || props.hasMoveDown) && (
                  <IconButton
                    icon="arrow-up"
                    className="array-item-move-up"
                    tabIndex="-1"
                    style={btnStyle}
                    disabled={props.disabled || props.readonly || !props.hasMoveUp}
                    onClick={props.onReorderClick(props.index, props.index - 1)}
                  />
                )}

                {(props.hasMoveUp || props.hasMoveDown) && (
                  <IconButton
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

                {props.hasEdit && (
                  <IconButton
                    type="primary"
                    icon="edit"
                    className="array-item-edit btn-sm"
                    tabIndex="-1"
                    style={btnStyle}
                    disabled={props.disabled || props.readonly}
                    onClick={props.onEditIndexClick(props.index)}
                  />
                )}

                {props.hasRemove && (
                  <Confirmation variant="outline-primary" disabled={props.disabled || props.readonly} headingText={"Are you sure to delete this items?"} onConfirmation={props.onDropIndexClick(props.index)} ButtonText={'X'} className={"array-item-remove"} />
                )}
              </div>
            </div>
          </div>
        )}
        <div className={/* props.hasToolbar ? "col-9" :  */"col-12"}>
          {props.children}
        </div>
      </div>
    </div>
  );
}

function DefaultFixedArrayFieldTemplate(props) {
  return (
    <fieldset className={props.className} id={props.idSchema.$id}>
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
          textValue="+"
          typeValue="secondary"
          className="array-item-add"
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
}

function DefaultNormalArrayFieldTemplate(props) {
  let AddButtonText = "+";
  if (props.uiSchema && props.uiSchema["ui:ArrayAddText"]) {
    AddButtonText = props.uiSchema["ui:ArrayAddText"];
  }
  return (
    <fieldset className={props.className} id={props.idSchema.$id}>
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
          className="array-item-add"
          textValue={AddButtonText}
          typeValue="link"
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
}

function generateRowId() {
  return shortid.generate();
}

function generateKeyedFormData(formData) {
  return !Array.isArray(formData)
    ? []
    : formData.map(item => {
      return {
        key: generateRowId(),
        isEditableArray: false,
        item,
      };
    });
}

function keyedToPlainFormData(keyedFormData) {
  return keyedFormData.map(keyedItem => keyedItem.item);
}

class ArrayField extends Component {
  static defaultProps = {
    uiSchema: {},
    formData: [],
    idSchema: {},
    required: false,
    disabled: false,
    readonly: false,
    isEditTrigger: false,
    autofocus: false,
  };

  constructor(props) {
    super(props);
    const { formData } = props;
    const keyedFormData = generateKeyedFormData(formData);
    this.state = {
      keyedFormData,
      updatedKeyedFormData: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // Don't call getDerivedStateFromProps if keyed formdata was just updated.
    if (prevState.updatedKeyedFormData) {
      return {
        updatedKeyedFormData: false,
      };
    }
    const nextFormData = nextProps.formData;
    const previousKeyedFormData = prevState.keyedFormData;
    const newKeyedFormData =
      nextFormData.length === previousKeyedFormData.length
        ? previousKeyedFormData.map((previousKeyedFormDatum, index) => {
          return {
            key: previousKeyedFormDatum.key,
            isEditableArray: previousKeyedFormDatum.isEditableArray,
            item: nextFormData[index],
          };
        })
        : generateKeyedFormData(nextFormData);
    return {
      keyedFormData: newKeyedFormData,
    };
  }

  get itemTitle() {
    const { schema } = this.props;
    return schema.items.title || schema.items.description || "Item";
  }

  isItemRequired(itemSchema) {
    if (Array.isArray(itemSchema.type)) {
      // While we don't yet support composite/nullable jsonschema types, it's
      // future-proof to check for requirement against these.
      return !includes(itemSchema.type, "null");
    }
    // All non-null array item types are inherently required by design
    return itemSchema.type !== "null";
  }

  canAddItem(formItems) {
    const { schema, uiSchema, permission, roleId, name } = this.props;
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
    if (permission && permission[roleId] && permission[roleId][5] !== undefined && includes(Object.values(permission[roleId][5]), name) && name) {
      addable = false;
    }

    return addable;
  }

  _getNewFormDataRow = () => {
    const { schema, registry = getDefaultRegistry() } = this.props;
    const { definitions } = registry;
    let itemSchema = schema.items;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems;
    }
    return getDefaultFormState(itemSchema, undefined, definitions);
  };

  onAddClick = ((event, newData = null) => {
    if (event) {
      event.preventDefault();
    }
    const { onChange, onBlur } = this.props;
    let newKeyedFormData = [];
    if (newData && Array.isArray(newData)) {
      const newKeyedFormDataRow = newData.map((item, i) => {
        return {
          key: generateRowId(),
          isEditableArray: false,
          item: (!item) ? this._getNewFormDataRow() : item,
        };
      });
      newKeyedFormData = [...this.state.keyedFormData, ...newKeyedFormDataRow];
    } else {
      const newKeyedFormDataRow = {
        key: generateRowId(),
        isEditableArray: false,
        item: (!newData) ? this._getNewFormDataRow() : newData,
      };
      newKeyedFormData = [...this.state.keyedFormData, newKeyedFormDataRow];
    }
    this.setState(
      {
        keyedFormData: newKeyedFormData,
        updatedKeyedFormData: true,
      },
      () => {
        onChange(keyedToPlainFormData(newKeyedFormData))
        onBlur(keyedToPlainFormData(newKeyedFormData))
      }
    );
  });

  onAddIndexClick = index => {
    return event => {
      if (event) {
        event.preventDefault();
      }
      const { onChange } = this.props;
      const newKeyedFormDataRow = {
        key: generateRowId(),
        isEditableArray: false,
        item: this._getNewFormDataRow(),
      };
      let newKeyedFormData = [...this.state.keyedFormData];
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

  onDropIndexClick = index => {
    return event => {
      if (event) {
        event.preventDefault();
      }
      const { onChange, onBlur } = this.props;
      const { keyedFormData } = this.state;
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
      const newKeyedFormData = keyedFormData.filter((_, i) => i !== index);
      this.setState(
        {
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true,
        },
        () => {
          onChange(keyedToPlainFormData(newKeyedFormData), newErrorSchema)
          onBlur(keyedToPlainFormData(newKeyedFormData), newErrorSchema)
        }
      );
    };
  };

  onEditIndexClick = index => {
    return event => {
      if (event) {
        event.preventDefault();
      }
      const { onChange } = this.props;
      const { keyedFormData } = this.state;
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
      const newKeyedFormData = keyedFormData;
      newKeyedFormData[index].isEditableArray = !keyedFormData[index].isEditableArray;
      this.setState(
        {
          keyedFormData: newKeyedFormData,
          updatedKeyedFormData: true,
        },
        () => onChange(keyedToPlainFormData(newKeyedFormData), newErrorSchema)
      );
    };
  };

  onReorderClick = (index, newIndex) => {
    return event => {
      if (event) {
        event.preventDefault();
        event.target.blur();
      }
      const { onChange } = this.props;
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

      const { keyedFormData } = this.state;
      function reOrderArray() {
        // Copy item
        let _newKeyedFormData = keyedFormData.slice();

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
        () => onChange(keyedToPlainFormData(newKeyedFormData), newErrorSchema)
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
      rawErrors,
      permission,
      updatedFields,
      updatedFieldClassName,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      subForms,
      roleId,
    } = this.props;
    const title = schema.title === undefined ? name : schema.title;
    const { ArrayFieldTemplate, definitions, fields, formContext } = registry;
    const { TitleField, DescriptionField } = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);

    const arrayProps = {
      canAdd: this.canAddItem(formData),
      items: this.state.keyedFormData.map((keyedItem, index) => {
        const { key, item, isEditableArray } = keyedItem;
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
          isEditableArray,
          key,
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
          permission,
          updatedFields,
          updatedFieldClassName,
          isDataLoaded,
          AuthID,
          EditorType,
          TaskID,
          timezone,
          subForms,
          roleId,
          name,
        });
      }),
      className: `field field-array field-array-of-${itemsSchema.type}`,
      DescriptionField,
      disabled,
      idSchema,
      uiSchema,
      permission,
      updatedFields,
      updatedFieldClassName,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      subForms,
      roleId,
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      title,
      TitleField,
      formContext,
      formData,
      rawErrors,
      registry,
      onDropIndexClick: this.onDropIndexClick,
    };

    // Check if a custom render function was passed in
    let Component =
      uiSchema["ui:ArrayFieldTemplate"] ||
      ArrayFieldTemplate ||
      DefaultNormalArrayFieldTemplate;
    return <Component {...arrayProps} />;
  }

  renderMultiSelect() {
    const {
      schema,
      idSchema,
      uiSchema,
      formData,
      taskData,
      disabled,
      readonly,
      required,
      label,
      placeholder,
      autofocus,
      onBlur,
      onFocus,
      registry = getDefaultRegistry(),
      rawErrors,
      permission,
      updatedFields,
      updatedFieldClassName,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      subForms,
      roleId,
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
        permission={permission}
        updatedFields={updatedFields}
        updatedFieldClassName={updatedFieldClassName}
        isDataLoaded={isDataLoaded}
        AuthID={AuthID}
        EditorType={EditorType}
        TaskID={TaskID}
        timezone={timezone}
        subForms={subForms}
        roleId={roleId}
        registry={registry}
        taskData={taskData}
        value={items}
        disabled={disabled}
        readonly={readonly}
        required={required}
        label={label}
        placeholder={placeholder}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
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
      rawErrors,
      permission,
      taskData,
      updatedFields,
      updatedFieldClassName,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      roleId,
      subForms,
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
        permission={permission}
        updatedFields={updatedFields}
        updatedFieldClassName={updatedFieldClassName}
        isDataLoaded={isDataLoaded}
        AuthID={AuthID}
        EditorType={EditorType}
        TaskID={TaskID}
        timezone={timezone}
        subForms={subForms}
        roleId={roleId}
        title={title}
        taskData={taskData}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
        rawErrors={rawErrors}
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
      rawErrors,
      permission,
      updatedFields,
      updatedFieldClassName,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      roleId,
      subForms,
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
      items: this.state.keyedFormData.map((keyedItem, index) => {
        const { key, item, isEditableArray } = keyedItem;
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
          isEditableArray,
          key,
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
          permission,
          updatedFields,
          updatedFieldClassName,
          isDataLoaded,
          AuthID,
          EditorType,
          TaskID,
          timezone,
          roleId,
          subForms,
        });
      }),
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      uiSchema,
      permission,
      updatedFields,
      updatedFieldClassName,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      subForms,
      roleId,
      title,
      TitleField,
      formContext,
      rawErrors,
      onDropIndexClick: this.onDropIndexClick,
    };

    // Check if a custom template template was passed in
    const Template =
      uiSchema["ui:ArrayFieldTemplate"] ||
      ArrayFieldTemplate ||
      DefaultFixedArrayFieldTemplate;
    return <Template {...arrayProps} />;
  }

  renderArrayFieldItem(props) {
    const {
      isEditableArray,
      key,
      index,
      canRemove = true,
      canMoveUp = true,
      CanEdit = false,
      canMoveDown = true,
      itemSchema,
      itemData,
      itemUiSchema,
      itemIdSchema,
      itemErrorSchema,
      permission,
      taskData,
      updatedFields,
      updatedFieldClassName,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      subForms,
      roleId,
      autofocus,
      onBlur,
      onFocus,
      rawErrors,
      name
    } = props;
    const {
      disabled,
      readonly,
      uiSchema,
      registry = getDefaultRegistry(),
    } = this.props;
    const {
      fields: { SchemaField },
    } = registry;
    const { orderable, removable, Editable } = {
      Editable: true,
      orderable: true,
      removable: true,
      ...uiSchema["ui:options"],
    };
    const has = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      remove: removable && canRemove,
      edit: Editable && CanEdit
    };
    has.toolbar = Object.keys(has).some(key => has[key]);
    let arrayLabelOnlyPermission = false;
    // Checking Edit and Remove option showing based on Auth
    if (itemData && AuthID && itemData['id'] !== undefined && itemData['id'] !== '-1' && itemData['user_id'] !== '-1' && permission && permission[roleId] && permission[roleId][6] !== undefined && includes(Object.values(permission[roleId][6]), name) && name) {
      has.remove = false;
      has.edit = false;
      if (parseInt(AuthID) === parseInt(itemData['user_id'])) {
        has.remove = true;
        has.edit = true;
      }
      if (!isEditableArray) {
        arrayLabelOnlyPermission = true;
      }
    } else if (permission && permission[roleId] && permission[roleId][7] !== undefined && itemData && AuthID && itemData['id'] !== undefined && itemData['id'] !== '-1') {
      has.remove = true;
      has.edit = true;
    } else if (permission && permission[roleId] && permission[roleId][5] !== undefined && includes(Object.values(permission[roleId][5]), name) && name) {
      arrayLabelOnlyPermission = true;
      has.remove = false;
      has.edit = false;
      has.moveDown = false;
      has.moveUp = false;
    }
    return {
      children: (
        <SchemaField
          schema={itemSchema}
          uiSchema={itemUiSchema}
          permission={permission}
          updatedFields={updatedFields}
          updatedFieldClassName={updatedFieldClassName}
          isDataLoaded={isDataLoaded}
          AuthID={AuthID}
          EditorType={EditorType}
          TaskID={TaskID}
          timezone={timezone}
          subForms={subForms}
          roleId={roleId}
          isEditTrigger={isEditableArray}
          arrayLabelOnlyPermission={arrayLabelOnlyPermission}
          taskData={taskData}
          formData={itemData}
          originalArrayData={itemData}
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
          rawErrors={rawErrors}
        />
      ),
      className: "col-12",
      disabled,
      hasToolbar: has.toolbar,
      hasMoveUp: has.moveUp,
      hasMoveDown: has.moveDown,
      hasRemove: has.remove,
      hasEdit: has.edit,
      index,
      key,
      onAddIndexClick: this.onAddIndexClick,
      onDropIndexClick: this.onDropIndexClick,
      onEditIndexClick: this.onEditIndexClick,
      onReorderClick: this.onReorderClick,
      readonly,
    };
  }
}

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = types.fieldProps;
}

polyfill(ArrayField);

export default ArrayField;
