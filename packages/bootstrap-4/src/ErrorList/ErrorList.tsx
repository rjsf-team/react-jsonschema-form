import React from "react";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import { ErrorListProps } from "@rjsf/core";

const ErrorList = ({ errors }: ErrorListProps) => (
  <Card border="danger" className="mb-2">
    <Card.Header className="alert-danger">Errors</Card.Header>
    <Card.Body className="p-0">
      <ListGroup variant="flush">
        {errors.map((error, i: number) => {
          return (
            <ListGroup.Item key={i}>
              <small>{error.stack}</small>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Card.Body>
  </Card>
);

export default ErrorList;
