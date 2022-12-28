import React from "react";

import {
  ADDITIONAL_PROPERTY_FLAG,
  WrapIfAdditionalTemplateProps,
} from "@rjsf/utils";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

const WrapIfAdditionalTemplate = ({
  classNames,
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: WrapIfAdditionalTemplateProps) => {
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = registry.templates.ButtonTemplates;
  const keyLabel = `${label} Key`; // i18n ?
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div className={classNames}>{children}</div>;
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onKeyChange(target.value);
  const keyId = `${id}-key`;

  return (
    <Row className={classNames} key={keyId}>
      <Col xs={5}>
        <Form.Group>
          <Form.Label htmlFor={keyId}>{keyLabel}</Form.Label>
          <Form.Control
            required={required}
            defaultValue={label}
            disabled={disabled || readonly}
            id={keyId}
            name={keyId}
            onBlur={!readonly ? handleBlur : undefined}
            type="text"
          />
        </Form.Group>
      </Col>
      <Col xs={5}>{children}</Col>
      <Col xs={2} className="py-4">
        <RemoveButton
          iconType="block"
          className="w-100"
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
          uiSchema={uiSchema}
          registry={registry}
        />
      </Col>
    </Row>
  );
};

export default WrapIfAdditionalTemplate;
