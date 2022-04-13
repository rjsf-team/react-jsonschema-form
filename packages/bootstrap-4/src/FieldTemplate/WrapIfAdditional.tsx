
import React from "react";

import { utils } from "@rjsf/core";
import { JSONSchema7 } from "json-schema";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

import IconButton from "../IconButton/IconButton";

const { ADDITIONAL_PROPERTY_FLAG } = utils;

type WrapIfAdditionalProps = {
  children: React.ReactElement;
  classNames: string;
  disabled: boolean;
  id: string;
  label: string;
  onDropPropertyClick: (index: string) => (event?: any) => void;
  onKeyChange: (index: string) => (event?: any) => void;
  readonly: boolean;
  required: boolean;
  schema: JSONSchema7;
};

const WrapIfAdditional = ({
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
}: WrapIfAdditionalProps) => {
  const keyLabel = `${label} Key`; // i18n ?
  const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);

  if (!additional) {
    return children;
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onKeyChange(target.value);

  return (
    <Row key={`${id}-key`}>
      <Col xs={5}>
        <Form.Group>
          <Form.Label>{keyLabel}</Form.Label>
          <Form.Control
            required={required}
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type="text"
          />
        </Form.Group>
      </Col>
      <Col xs={5}>
        {children}
      </Col>
      <Col xs={2} className="py-4">
        <IconButton
          block={true}
          className="w-100"
          variant="danger"
          icon="remove"
          tabIndex={-1}
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
        />
      </Col>
    </Row>
  );
};

export default WrapIfAdditional;
