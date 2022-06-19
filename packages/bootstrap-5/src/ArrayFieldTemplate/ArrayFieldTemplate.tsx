import React from "react";
import { utils } from "@rjsf/core";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { ArrayFieldTemplateProps, IdSchema } from "@rjsf/core";

import AddButton from "../AddButton/AddButton";
import IconButton from "../IconButton/IconButton";

const { isMultiSelect, getDefaultRegistry } = utils;

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { schema, registry = getDefaultRegistry() } = props;

  if (isMultiSelect(schema, registry.rootSchema)) {
    return <DefaultFixedArrayFieldTemplate {...props} />;
  } else {
    return <DefaultNormalArrayFieldTemplate {...props} />;
  }
};

type ArrayFieldTitleProps = {
  TitleField: any;
  idSchema: IdSchema;
  title: string;
  required: boolean;
};

const ArrayFieldTitle = ({
  TitleField,
  idSchema,
  title,
  required,
}: ArrayFieldTitleProps) => {
  if (!title) {
    return null;
  }

  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
};

type ArrayFieldDescriptionProps = {
  DescriptionField: any;
  idSchema: IdSchema;
  description: string;
};

const ArrayFieldDescription = ({
  DescriptionField,
  idSchema,
  description,
}: ArrayFieldDescriptionProps) => {
  if (!description) {
    return null;
  }

  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
};

// Used in the two templates
const DefaultArrayItem = (props: any) => {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };
  return (
    <div key={props.key}>
      <Row className="mb-2  d-flex align-items-center">
        <Col xs="9" lg="9">{props.children}</Col>

        <Col xs="3" lg="3" className="py-4">
          {props.hasToolbar && (
            <div className="d-flex flex-row">
              {(props.hasMoveUp || props.hasMoveDown) && (
                <div className="m-0 p-0">
                  <IconButton
                    icon="arrow-up"
                    className="array-item-move-up"
                    tabIndex={-1}
                    style={btnStyle as any}
                    disabled={
                      props.disabled || props.readonly || !props.hasMoveUp
                    }
                    onClick={props.onReorderClick(props.index, props.index - 1)}
                  />
                </div>
              )}

              {(props.hasMoveUp || props.hasMoveDown) && (
                <div className="m-0 p-0">
                  <IconButton
                    icon="arrow-down"
                    tabIndex={-1}
                    style={btnStyle as any}
                    disabled={
                      props.disabled || props.readonly || !props.hasMoveDown
                    }
                    onClick={props.onReorderClick(props.index, props.index + 1)}
                  />
                </div>
              )}

              {props.hasRemove && (
                <div className="m-0 p-0">
                  <IconButton
                    icon="remove"
                    tabIndex={-1}
                    style={btnStyle as any}
                    disabled={props.disabled || props.readonly}
                    onClick={props.onDropIndexClick(props.index)}
                  />
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

const DefaultFixedArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  return (
    <fieldset className={props.className}>
      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.uiSchema["ui:title"] || props.title}
        required={props.required}
      />

      {(props.uiSchema["ui:description"] || props.schema.description) && (
        <div
          className="field-description"
          key={`field-description-${props.idSchema.$id}`}>
          {props.uiSchema["ui:description"] || props.schema.description}
        </div>
      )}

      <div
        className="row array-item-list"
        key={`array-item-list-${props.idSchema.$id}`}>
        {props.items && props.items.map(DefaultArrayItem)}
      </div>

      {props.canAdd && (
        <AddButton
          className="array-item-add"
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
};

const DefaultNormalArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  return (
    <div>
      <Row className="p-0 m-0">
        <Col className="p-0 m-0">
        <ArrayFieldTitle
          key={`array-field-title-${props.idSchema.$id}`}
          TitleField={props.TitleField}
          idSchema={props.idSchema}
          title={props.uiSchema["ui:title"] || props.title}
          required={props.required}
        />

        {(props.uiSchema["ui:description"] || props.schema.description) && (
          <ArrayFieldDescription
            key={`array-field-description-${props.idSchema.$id}`}
            DescriptionField={props.DescriptionField}
            idSchema={props.idSchema}
            description={
              props.uiSchema["ui:description"] || props.schema.description
            }
          />
        )}

        <Container fluid key={`array-item-list-${props.idSchema.$id}`} className="p-0 m-0">
          {props.items && props.items.map(p => DefaultArrayItem(p))}

          {props.canAdd && (
            <Container className="">
              <Row className="mt-2">
                <Col xs={9}></Col>
                <Col xs={3} className="py-4 col-lg-3 col-3"> <AddButton
                  className="array-item-add"
                  onClick={props.onAddClick}
                  disabled={props.disabled || props.readonly}
                /></Col>

              </Row>
            </Container>
          )}
        </Container></Col>

      </Row>
    </div>
  );
};

export default ArrayFieldTemplate;
