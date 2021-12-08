import React from "react";
import AddButton from "../AddButton";
import { cleanClassNames } from "../util";
import { ArrayFieldTitle, DefaultArrayItem } from './ArrayFieldTemplate';
// Used for arrays that are represented as multiple selection fields
// (displayed as a multi select or checkboxes)
export function DefaultFixedArrayFieldTemplate({
  uiSchema,
  idSchema,
  canAdd,
  className,
  classNames,
  disabled,
  items,
  onAddClick,
  readOnly,
  required,
  schema,
  title,
  TitleField,
  itemProps,
}) {
  const fieldTitle = uiSchema["ui:title"] || title;
  const fieldDescription = uiSchema["ui:description"] || schema.description;

  return (
    <div className={cleanClassNames([className, classNames])}>
      <ArrayFieldTitle
        key={`array-field-title-${idSchema.$id}`}
        TitleField={TitleField}
        idSchema={idSchema}
        uiSchema={uiSchema}
        title={fieldTitle}
        required={required}
      />

      {fieldDescription && (
        <div
          className="field-description"
          key={`field-description-${idSchema.$id}`}>
          {fieldDescription}
        </div>
      )}

      <div key={`array-item-list-${idSchema.$id}`}>
        <div className="row array-item-list">
          {items && items.map(p => DefaultArrayItem({ ...p, ...itemProps }))}
        </div>

        {canAdd && (
          <div
            style={{
              marginTop: "1rem",
              position: "relative",
              textAlign: "right",
            }}>
            <AddButton onClick={onAddClick} disabled={disabled || readOnly} />
          </div>
        )}
      </div>
    </div>
  );
}
