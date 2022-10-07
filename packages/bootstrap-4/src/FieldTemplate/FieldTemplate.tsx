import React from "react";
import { FieldTemplateProps, getTemplate, getUiOptions } from "@rjsf/utils";
import Form from "react-bootstrap/Form";

const FieldTemplate = ({
  id,
  children,
  displayLabel,
  rawErrors = [],
  errors,
  help,
  rawDescription,
  classNames,
  disabled,
  label,
  hidden,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: FieldTemplateProps) => {
  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<"WrapIfAdditionalTemplate">(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions
  );
  if (hidden) {
    return <div className="hidden">{children}</div>;
  }
  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <Form.Group>
        {displayLabel && (
          <Form.Label
            htmlFor={id}
            className={rawErrors.length > 0 ? "text-danger" : ""}
          >
            {label}
            {required ? "*" : null}
          </Form.Label>
        )}
        {children}
        {displayLabel && rawDescription && (
          <Form.Text
            className={rawErrors.length > 0 ? "text-danger" : "text-muted"}
          >
            {rawDescription}
          </Form.Text>
        )}
        {errors}
        {help}
      </Form.Group>
    </WrapIfAdditionalTemplate>
  );
};

export default FieldTemplate;
