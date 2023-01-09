import React from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

export default function ErrorList<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ errors }: ErrorListProps<T, S, F>) {
  return (
    <Card border="danger" className="mb-4">
      <Card.Header className="alert-danger">Errors</Card.Header>
      <Card.Body className="p-0">
        <ListGroup>
          {errors.map((error, i: number) => {
            return (
              <ListGroup.Item key={i} className="border-0">
                <span>{error.stack}</span>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
