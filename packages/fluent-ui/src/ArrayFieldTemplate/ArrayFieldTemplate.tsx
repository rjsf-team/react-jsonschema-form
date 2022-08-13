import * as React from "react";
import {
  getUiOptions,
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
} from "@rjsf/utils";
import AddButton from "../AddButton";

const rightJustify = {
  float: "right",
} as React.CSSProperties;

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const {
    canAdd,
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
    <>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      {(uiOptions.description || schema.description) && (
        <ArrayFieldDescriptionTemplate
          idSchema={idSchema}
          description={(uiOptions.description || schema.description)!}
          registry={registry}
        />
      )}
      {items.length > 0 &&
        items.map((itemProps: ArrayFieldTemplateItemType) => (
          <ArrayFieldItemTemplate {...itemProps} />
        ))}
      {canAdd && (
        <span style={rightJustify}>
          <AddButton
            className="array-item-add"
            onClick={onAddClick}
            disabled={disabled || readonly}
          />
        </span>
      )}
    </>
  );
};

export default ArrayFieldTemplate;
