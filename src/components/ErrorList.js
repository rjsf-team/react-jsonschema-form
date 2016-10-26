import React from "react";

import Panel from "react-bootstrap/lib/Panel";
import ListGroup from "react-bootstrap/lib/ListGroup";
import ListGroupItem from "react-bootstrap/lib/ListGroupItem";

export default function ErrorList({errors}) {
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
