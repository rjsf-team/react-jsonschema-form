import React from "react";

import {
  getUiOptions,
  getWidget,
  isFixedItems,
  optionsList,
  ITEMS_KEY,
} from "@rjsf/utils";

import FixedArrayFieldTemplate from "./FixedArrayFieldTemplate";
import NormalArrayFieldTemplate from "./NormalArrayFieldTemplate";

const ArrayFieldTemplate = ({
  autofocus,
  canAdd,
  className,
  disabled,
  formContext,
  formData,
  idSchema,
  items,
  label,
  name,
  onAddClick,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  rawErrors,
  readonly,
  registry,
  required,
  schema,
  title,
  uiSchema,
}) => {
  const { fields, schemaUtils, widgets } = registry;
  const { UnsupportedField } = fields;

  const renderFiles = () => {
    const { widget = "files", ...options } = getUiOptions(uiSchema);

    const Widget = getWidget(schema, widget, widgets);

    return (
      <Widget
        autofocus={autofocus}
        disabled={disabled}
        formContext={formContext}
        id={idSchema && idSchema.$id}
        multiple
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        options={options}
        rawErrors={rawErrors}
        readonly={readonly}
        registry={registry}
        schema={schema}
        title={schema.title || name} // Why not props.title?
        value={formData}
      />
    );
  };

  const renderMultiSelect = () => {
    const itemsSchema = schemaUtils.retrieveSchema(schema.items, formData);
    const enumOptions = optionsList(itemsSchema);
    const { widget = "select", ...options } = {
      ...getUiOptions(uiSchema),
      enumOptions,
    };

    const Widget = getWidget(schema, widget, widgets);

    return (
      <Widget
        autofocus={autofocus}
        disabled={disabled}
        formContext={formContext}
        id={idSchema && idSchema.$id}
        label={label}
        multiple
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        options={options}
        placeholder={placeholder}
        rawErrors={rawErrors}
        readonly={readonly}
        registry={registry}
        required={required}
        schema={schema}
        value={formData}
      />
    );
  };

  if (!(ITEMS_KEY in schema)) {
    return (
      <UnsupportedField
        idSchema={idSchema}
        reason="Missing items definition"
        schema={schema}
      />
    );
  }

  if (isFixedItems(schema)) {
    return (
      <FixedArrayFieldTemplate
        canAdd={canAdd}
        className={className}
        disabled={disabled}
        formContext={formContext}
        formData={formData}
        idSchema={idSchema}
        items={items}
        onAddClick={onAddClick}
        readonly={readonly}
        registry={registry}
        required={required}
        schema={schema}
        title={title}
        uiSchema={uiSchema}
      />
    );
  }
  if (schemaUtils.isFilesArray(schema, uiSchema)) {
    return renderFiles();
  }
  if (schemaUtils.isMultiSelect(schema)) {
    return renderMultiSelect();
  }

  return (
    <NormalArrayFieldTemplate
      canAdd={canAdd}
      className={className}
      disabled={disabled}
      formContext={formContext}
      formData={formData}
      idSchema={idSchema}
      items={items}
      onAddClick={onAddClick}
      readonly={readonly}
      registry={registry}
      required={required}
      schema={schema}
      title={title}
      uiSchema={uiSchema}
    />
  );
};

export default ArrayFieldTemplate;
