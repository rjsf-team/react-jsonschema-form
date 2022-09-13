import React from "react";
import { FieldTemplateProps } from "@rjsf/utils";
import Form from "react-bootstrap/Form";

import WrapIfAdditional from "./WrapIfAdditional";

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
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  registry,
}: FieldTemplateProps) => {
  return (
    <WrapIfAdditional
      classNames={classNames}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      registry={registry}
    >
      <Form.Group>
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
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
