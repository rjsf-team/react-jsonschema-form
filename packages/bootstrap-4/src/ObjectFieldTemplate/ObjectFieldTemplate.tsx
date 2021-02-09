import React from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { ObjectFieldTemplateProps } from "@rjsf/core";
import { utils } from '@rjsf/core';

import AddButton from "../AddButton/AddButton";

const { canExpand } = utils;

const ObjectFieldTemplate = ({
  DescriptionField,
  description,
  TitleField,
  title,
  properties,
  required,
  uiSchema,
  idSchema,
  schema,
  formData,
  onAddClick,
  disabled,
  readonly
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
      {properties.map(({content}) => content)}

      {canExpand(schema, uiSchema, formData) && (
        <Row>
          <Col xs={{ offset: 9, span: 3 }} className="py-4">
            <AddButton
              onClick={onAddClick(schema)}
              disabled={disabled || readonly}
              className="object-property-expand"
            />
          </Col>
        </Row>
      )}
    </>
  );
};

export default ObjectFieldTemplate;
