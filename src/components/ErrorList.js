import React from "react";

import { Panel, ListGroup, ListGroupItem } from "react-bootstrap";

export default function ErrorList({ errors }) {
  return (
    <Panel header="Errors" bsStyle="danger" className="errors">
      <ListGroup fill>{
        errors.map((error, i) => {
          return (
            <ListGroupItem key={i} bsStyle="danger">{
              error.stack
            }</ListGroupItem>
          );
        })
      }</ListGroup>
    </Panel>
  );
}
