import React from "react";

import { utils } from "@rjsf/core";

import { ArrayFieldTemplateProps, IdSchema } from "@rjsf/core";

import AddButton from "../AddButton/AddButton";
import IconButton from "../IconButton/IconButton";

const rightJustify = {
  float: "right"
} as React.CSSProperties;

const { isMultiSelect, getDefaultRegistry } = utils;

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { schema, registry = getDefaultRegistry() } = props;

  if (isMultiSelect(schema, registry.rootSchema)) {
    return <DefaultFixedArrayFieldTemplate {...props} />;
  } else {
    return <DefaultNormalArrayFieldTemplate {...props} />;
  }
};

type ArrayFieldTitleProps = {
  TitleField: any;
  idSchema: IdSchema;
  title: string;
  required: boolean;
};

const ArrayFieldTitle = ({
  TitleField,
  idSchema,
  title,
  required,
}: ArrayFieldTitleProps) => {
  if (!title) {
    return null;
  }

  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
};

type ArrayFieldDescriptionProps = {
  DescriptionField: any;
  idSchema: IdSchema;
  description: string;
};

const ArrayFieldDescription = ({
  DescriptionField,
  idSchema,
  description,
}: ArrayFieldDescriptionProps) => {
  if (!description) {
    return null;
  }

  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
};

// Used in the two templates
const DefaultArrayItem = (props: any) => {
  return (
    <div key={props.key} className="ms-Grid" dir="ltr">
      <div className="ms-Grid-row">
        <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg9">
          <div className="ms-Grid-row">
          {props.children}
          </div>
        </div>
        <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg3" style={{textAlign: "right"}}>
          <IconButton
            icon="arrow-up"
            className="array-item-move-up"
            disabled={props.disabled || props.readonly || !props.hasMoveUp}
            onClick={props.onReorderClick(props.index, props.index - 1)}
          />
          <IconButton
            icon="arrow-down"
            className="array-item-move-down"
            disabled={props.disabled || props.readonly || !props.hasMoveDown}
            onClick={props.onReorderClick(props.index, props.index + 1)}
          />
          <IconButton
            icon="remove"
            className="array-item-remove"
            disabled={props.disabled || props.readonly}
            onClick={props.onDropIndexClick(props.index)}
          />
        </div>
      </div>
    </div>
  );
};

const DefaultFixedArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
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
        <span style={rightJustify}>
          <AddButton
            className="array-item-add"
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
          />
        </span>
      )}
    </fieldset>
  );
};

const DefaultNormalArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  return (
    <>
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

      {props.items && props.items.map(p => DefaultArrayItem(p))}

      {props.canAdd && (
        <span style={rightJustify}>
          <AddButton
            className="array-item-add"
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
          />
        </span>
      )}
    </>
  );
};

export default ArrayFieldTemplate;
