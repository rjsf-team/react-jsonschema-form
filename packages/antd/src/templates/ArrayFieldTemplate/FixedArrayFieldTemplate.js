import React from 'react';
// import PropTypes from 'prop-types';

import { ArrayFieldTemplateProps } from 'react-jsonschema-form';
import { Button, Col, Icon, Row } from 'antd';

import ArrayFieldTemplateItem from './ArrayFieldTemplateItem';

const FixedArrayFieldTemplate = ({
  canAdd,
  className,
  // DescriptionField,
  disabled,
  // formContext,
  // formData,
  idSchema,
  items,
  onAddClick,
  readonly,
  // registry,
  required,
  schema,
  title,
  TitleField,
  uiSchema,
}) => (
  <fieldset className={className} id={idSchema.$id}>
    {title && (
      <TitleField
        id={`${idSchema.$id}__title`}
        key={`array-field-title-${idSchema.$id}`}
        required={required}
        title={uiSchema['ui:title'] || title}
      />
    )}

    {(uiSchema['ui:description'] || schema.description) && (
      <div
        className="field-description"
        key={`field-description-${idSchema.$id}`}
      >
        {uiSchema['ui:description'] || schema.description}
      </div>
    )}

    <div
      className="row array-item-list"
      key={`array-item-list-${idSchema.$id}`}
    >
      {items && items.map(ArrayFieldTemplateItem)}
    </div>

    {canAdd && (
      <Row gutter={24} type="flex">
        <Col style={{ flex: '1' }} />
        <Col style={{ width: '192px' }}>
          <Button
            className="array-item-add"
            disabled={disabled || readonly}
            onClick={onAddClick}
            style={{ width: '100%' }}
            type="primary"
          >
            <Icon type="plus-circle" /> Add Item
          </Button>
        </Col>
      </Row>
    )}
  </fieldset>
);

FixedArrayFieldTemplate.propTypes = ArrayFieldTemplateProps;

export default FixedArrayFieldTemplate;
