import React from 'react';
// import PropTypes from 'prop-types';
import _ from 'lodash';

import { ObjectFieldTemplateProps } from 'react-jsonschema-form';

import { Col, Row } from 'antd';

const ObjectFieldTemplate = ({
  DescriptionField,
  TitleField,
  description,
  formContext,
  // formData,
  idSchema,
  properties,
  required,
  // schema,
  title,
  uiSchema,
}) => {
  const { colSpan, rowGutter = 24 } = formContext;

  const findSchema = element => element.content.props.schema;

  const findSchemaType = element => findSchema(element).type;

  const findUiSchema = element => element.content.props.uiSchema;

  const findUiSchemaField = element => findUiSchema(element)['ui:field'];

  const findUiSchemaWidget = element => findUiSchema(element)['ui:widget'];

  const calculateColSpan = element => {
    if (Number.isInteger(colSpan)) {
      return colSpan;
    }

    const type = findSchemaType(element);
    const field = findUiSchemaField(element);
    const widget = findUiSchemaWidget(element);

    const defaultColSpan =
      properties.length < 2 || // Single or no field in object.
      type === 'object' ||
      type === 'array' ||
      widget === 'textarea'
        ? 24
        : 12;

    if (_.isObject(colSpan)) {
      return (
        colSpan[widget] || colSpan[field] || colSpan[type] || defaultColSpan
      );
    }
    return defaultColSpan;
  };

  const filterHidden = element =>
    element.content.props.uiSchema['ui:widget'] !== 'hidden';

  return (
    <Row gutter={rowGutter}>
      <fieldset id={idSchema.$id}>
        {uiSchema['ui:title'] !== false && (uiSchema['ui:title'] || title) && (
          <TitleField
            id={`${idSchema.$id}-title`}
            required={required}
            title={uiSchema['ui:title'] || title}
          />
        )}
        {uiSchema['ui:description'] !== false &&
          (uiSchema['ui:description'] || description) && (
            <DescriptionField
              description={uiSchema['ui:description'] || description}
              id={`${idSchema.$id}-description`}
            />
          )}
        {properties.filter(filterHidden).map(element => (
          <Col key={element.name} span={calculateColSpan(element)}>
            {element.content}
          </Col>
        ))}
      </fieldset>
    </Row>
  );
};

ObjectFieldTemplate.propTypes = ObjectFieldTemplateProps;

export default ObjectFieldTemplate;
