import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import {
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  getTemplate,
  getUiOptions,
} from "@rjsf/utils";

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const {
    canAdd,
    disabled,
    idSchema,
    uiSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const ArrayFieldDescriptionTemplate =
    getTemplate<"ArrayFieldDescriptionTemplate">(
      "ArrayFieldDescriptionTemplate",
      registry,
      uiOptions
    );
  const ArrayFieldItemTemplate = getTemplate<"ArrayFieldItemTemplate">(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<"ArrayFieldTitleTemplate">(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <div>
      <Row className="p-0 m-0">
        <Col className="p-0 m-0">
          <ArrayFieldTitleTemplate
            idSchema={idSchema}
            title={uiOptions.title || title}
            uiSchema={uiSchema}
            required={required}
            registry={registry}
          />
          {(uiOptions.description || schema.description) && (
            <ArrayFieldDescriptionTemplate
              idSchema={idSchema}
              description={(uiOptions.description || schema.description)!}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
          <Container
            fluid
            key={`array-item-list-${idSchema.$id}`}
            className="p-0 m-0"
          >
            {items &&
              items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType) => (
                <ArrayFieldItemTemplate key={key} {...itemProps} />
              ))}
            {canAdd && (
              <Container className="">
                <Row className="mt-2">
                  <Col xs={9}></Col>
                  <Col xs={3} className="py-4 col-lg-3 col-3">
                    <AddButton
                      className="array-item-add"
                      onClick={onAddClick}
                      disabled={disabled || readonly}
                    />
                  </Col>
                </Row>
              </Container>
            )}
          </Container>
        </Col>
      </Row>
    </div>
  );
};

export default ArrayFieldTemplate;
