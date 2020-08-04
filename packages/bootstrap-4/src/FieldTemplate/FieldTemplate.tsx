import React from "react";

import { FieldTemplateProps } from "@rjsf/core";

import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

const FieldTemplate = ({
  id,
  children,
  displayLabel,
  rawErrors = [],
  rawHelp,
  rawDescription,
}: FieldTemplateProps) => {
  return (
    <Form.Group>
      {children}
      {displayLabel && rawDescription ? (
        <Form.Text className={rawErrors.length > 0 ? "text-danger" : "text-muted"}>
          {rawDescription}
        </Form.Text>
      ) : null}
      {rawErrors.length > 0 && (
        <ListGroup as="ul">
          {rawErrors.map((error: string) => {
            return (
              <ListGroup.Item as="li" key={error} className="border-0 m-0 p-0">
                <small className="m-0 text-danger">
                  {error}
                </small>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
      {rawHelp && (
        <Form.Text
          className={rawErrors.length > 0 ? "text-danger" : "text-muted"}
          id={id}>
          {rawHelp}
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default FieldTemplate;
