import React from "react";

import { FieldTemplateProps } from "@rjsf/utils";

import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

import WrapIfAdditional from "./WrapIfAdditional";

const FieldTemplate = ({
  id,
  children,
  displayLabel,
  rawErrors = [],
  rawHelp,
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
        {rawErrors.length > 0 && (
          <ListGroup as="ul">
            {rawErrors.map((error: string) => {
              return (
                <ListGroup.Item
                  as="li"
                  key={error}
                  className="border-0 m-0 p-0"
                >
                  <small className="m-0 text-danger">{error}</small>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
        {rawHelp && (
          <Form.Text
            className={rawErrors.length > 0 ? "text-danger" : "text-muted"}
            id={id}
          >
            {rawHelp}
          </Form.Text>
        )}
      </Form.Group>
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
