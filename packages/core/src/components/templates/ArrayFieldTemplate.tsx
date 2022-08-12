import React from "react";
import {
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
} from "@rjsf/utils";

import AddButton from "../AddButton";

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const {
    canAdd,
    className,
    disabled,
    idSchema,
    uiSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTitleTemplate,
  } = registry.templates;
  const uiOptions = getUiOptions(uiSchema);
  return (
    <fieldset className={className} id={idSchema.$id}>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        required={required}
        uiSchema={uiSchema}
        registry={registry}
      />
      {(uiOptions.description || schema.description) && (
        <ArrayFieldDescriptionTemplate
          idSchema={idSchema}
          description={(uiOptions.description || schema.description)!}
          registry={registry}
        />
      )}
      <div className="row array-item-list">
        {items &&
          items.map((itemProps: ArrayFieldTemplateItemType) => (
            <ArrayFieldItemTemplate {...itemProps} />
          ))}
      </div>

      {canAdd && (
        <AddButton
          className="array-item-add"
          onClick={onAddClick}
          disabled={disabled || readonly}
        />
      )}
    </fieldset>
  );
}
