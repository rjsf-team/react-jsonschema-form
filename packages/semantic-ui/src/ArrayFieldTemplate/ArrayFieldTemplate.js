/* eslint-disable react/prop-types,react/destructuring-assignment */
import { getUiOptions, isFixedItems } from "@rjsf/utils";

import AddButton from "../AddButton";
import { cleanClassNames, getSemanticProps } from "../util";

function ArrayFieldTemplate({
  uiSchema,
  idSchema,
  canAdd,
  className,
  classNames,
  disabled,
  formContext,
  items,
  onAddClick,
  options,
  readOnly,
  required,
  schema,
  title,
  registry,
}) {
  const semanticProps = getSemanticProps({
    options,
    uiSchema,
    formContext,
    defaultSchemaProps: { horizontalButtons: false, wrapItem: false },
  });
  const { horizontalButtons, wrapItem } = semanticProps;
  const itemProps = { horizontalButtons, wrapItem };
  const {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTitleTemplate,
  } = registry.templates;
  const uiOptions = getUiOptions(uiSchema);
  const fieldTitle = uiOptions.title || title;
  const fieldDescription = uiOptions.description || schema.description;
  return (
    <div
      className={cleanClassNames([
        className,
        classNames,
        isFixedItems(schema) ? "" : "sortable-form-fields",
      ])}
    >
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={fieldTitle}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      {fieldDescription && (
        <ArrayFieldDescriptionTemplate
          idSchema={idSchema}
          description={fieldDescription}
          registry={registry}
        />
      )}
      <div key={`array-item-list-${idSchema.$id}`}>
        <div className="row array-item-list">
          {items &&
            items.map(props => (
              <ArrayFieldItemTemplate {...props} {...itemProps} />
            ))}
        </div>
        {canAdd && (
          <div
            style={{
              marginTop: "1rem",
              position: "relative",
              textAlign: "right",
            }}
          >
            <AddButton onClick={onAddClick} disabled={disabled || readOnly} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ArrayFieldTemplate;
