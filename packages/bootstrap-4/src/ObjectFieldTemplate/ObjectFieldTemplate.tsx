import React from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { ObjectFieldTemplateProps } from "@rjsf/core";

const ObjectFieldTemplate = ({
  DescriptionField,
  description,
  TitleField,
  title,
  properties,
  required,
  uiSchema,
  idSchema,
}: ObjectFieldTemplateProps) => {
  return (
    <>
      {(uiSchema["ui:title"] || title) && (
        <TitleField
          id={`${idSchema.$id}-title`}
          title={title}
          required={required}
        />
      )}
      {description && (
        <DescriptionField
          id={`${idSchema.$id}-description`}
          description={description}
        />
      )}
      <Container fluid className="p-0">
        {properties.map((element: any, index: number) => (
          <Row
            key={index}
            style={{ marginBottom: "10px" }}
            className={element.hidden ? "d-none" : undefined}>
            <Col xs={12}> {element.content}</Col>
          </Row>
        ))}
      </Container>
    </>
  );
};

export default ObjectFieldTemplate;
