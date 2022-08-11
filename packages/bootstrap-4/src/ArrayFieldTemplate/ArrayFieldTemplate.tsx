import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import {
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  getUiOptions,
} from "@rjsf/utils";

import AddButton from "../AddButton";

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
  const {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTitleTemplate,
  } = registry.templates;
  const uiOptions = getUiOptions(uiSchema);
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
              registry={registry}
            />
          )}
          <Container
            fluid
            key={`array-item-list-${idSchema.$id}`}
            className="p-0 m-0"
          >
            {items &&
              items.map((itemProps: ArrayFieldTemplateItemType) => (
                <ArrayFieldItemTemplate {...itemProps} />
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
