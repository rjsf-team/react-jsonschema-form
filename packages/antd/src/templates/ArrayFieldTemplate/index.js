import React from 'react';

import { utils } from '@rjsf/core';

import FixedArrayFieldTemplate from './FixedArrayFieldTemplate';
import NormalArrayFieldTemplate from './NormalArrayFieldTemplate';

const {
  getUiOptions,
  getWidget,
  isFilesArray,
  isFixedItems,
  isMultiSelect,
  optionsList,
  retrieveSchema,
} = utils;

const ArrayFieldTemplate = ({
  DescriptionField,
  TitleField,
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
  const { fields, rootSchema, widgets } = registry;
  const { UnsupportedField } = fields;

  const renderFiles = () => {
    const { widget = 'files', ...options } = getUiOptions(uiSchema);

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
    const itemsSchema = retrieveSchema(schema.items, rootSchema, formData);
    const enumOptions = optionsList(itemsSchema);
    const { widget = 'select', ...options } = {
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

  if (!Object.prototype.hasOwnProperty.call(schema, 'items')) {
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
        DescriptionField={DescriptionField}
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
        TitleField={TitleField}
        uiSchema={uiSchema}
      />
    );
  }
  if (isFilesArray(schema, uiSchema, rootSchema)) {
    return renderFiles();
  }
  if (isMultiSelect(schema, rootSchema)) {
    return renderMultiSelect();
  }

  return (
    <NormalArrayFieldTemplate
      canAdd={canAdd}
      className={className}
      DescriptionField={DescriptionField}
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
      TitleField={TitleField}
      uiSchema={uiSchema}
    />
  );
};

export default ArrayFieldTemplate;
