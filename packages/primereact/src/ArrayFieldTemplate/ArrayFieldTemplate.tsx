import React from "react";
import { utils } from "@rjsf/core";
import { ArrayFieldTemplateProps, IdSchema } from "@rjsf/core";

import IconButton from "../IconButton/IconButton";

const { isMultiSelect, getDefaultRegistry } = utils;

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { schema, registry = getDefaultRegistry() } = props;

  if (isMultiSelect(schema, registry.rootSchema)) {
    return <DefaultFixedArrayFieldTemplate {...props} />;
  }
  return <DefaultNormalArrayFieldTemplate {...props} />;
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
  return (
    <TitleField id={id} title={title} required={required} />
  );
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
  return (
    <DescriptionField id={id} description={description} />
  );
};

// Used in the two templates
const DefaultArrayItem = (props: any) => {
  const canMoveItems = props.hasMoveUp || props.hasMoveDown;
  return (
    <div key={props.key} className="flex align-items-start gap-2 p-2 border-1 border-round">
      <div className="flex-grow-1">{props.children}</div>
      <div>
        {props.hasToolbar && (
          <div className="flex flex-row">
            {canMoveItems && (
              <>
                <IconButton
                  icon="arrow-up"
                  className="array-item-move-up"
                  style={props.hasRemove ? {
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  } : undefined}
                  disabled={props.disabled || props.readonly || !props.hasMoveUp}
                  onClick={props.onReorderClick(props.index, props.index - 1)}
                />
                <IconButton
                  icon="arrow-down"
                  style={{
                    borderLeft: 0,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    ...(props.hasRemove ? {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    } : {}),
                  }}
                  disabled={props.disabled || props.readonly || !props.hasMoveDown}
                  onClick={props.onReorderClick(props.index, props.index + 1)}
                />
              </>
            )}

            {props.hasRemove && (
              <IconButton
                icon="remove"
                style={canMoveItems ? {
                  borderLeft: 0,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                } : undefined}
                disabled={props.disabled || props.readonly}
                onClick={props.onDropIndexClick(props.index)}
              />
            )}
          </div>
        )}
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
        className="array-item-list flex flex-column gap-2"
        key={`array-item-list-${props.idSchema.$id}`}
      >
        {props.items && props.items.map(DefaultArrayItem)}
      </div>

      {props.canAdd && (
        <IconButton
          icon="plus"
          className="mt-3 mb-3 array-item-add"
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
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

      <div key={`array-item-list-${props.idSchema.$id}`} className="flex flex-column gap-2">
        {props.items && props.items.map(p => DefaultArrayItem(p))}

        {props.canAdd && (
          <IconButton
            icon="plus"
            className="mt-1 mb-3 array-item-add"
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
          />
        )}
      </div>
    </>
  );
};

export default ArrayFieldTemplate;
