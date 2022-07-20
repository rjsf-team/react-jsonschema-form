import React from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import { ErrorListProps } from "@rjsf/utils";

const ErrorList = ({ errors }: ErrorListProps) => (
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

export default ErrorList;
