import React from "react";
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
} from "@rjsf/utils";

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldTemplate<T = any, F = any>(
  props: ArrayFieldTemplateProps<T, F>
) {
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
  const uiOptions = getUiOptions<T, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<
    "ArrayFieldDescriptionTemplate",
    T,
    F
  >("ArrayFieldDescriptionTemplate", registry, uiOptions);
  const ArrayFieldItemTemplate = getTemplate<"ArrayFieldItemTemplate", T, F>(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<"ArrayFieldTitleTemplate", T, F>(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
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
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className="row array-item-list">
        {items &&
          items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType) => (
            <ArrayFieldItemTemplate key={key} {...itemProps} />
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
