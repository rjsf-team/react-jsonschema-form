import React from 'react';

import { utils } from '@rjsf/core';
import Button from 'antd/lib/button';
import Col from 'antd/lib/col';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Row from 'antd/lib/row';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';

const { ADDITIONAL_PROPERTY_FLAG } = utils;

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

const INPUT_STYLE = {
  width: '100%',
};

const WrapIfAdditional = ({
  children,
  classNames,
  disabled,
  formContext,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
}) => {
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    readonlyAsDisabled = true,
    rowGutter = 24,
    toolbarAlign = 'top',
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
  } = formContext;

  const keyLabel = `${label} Key`; // i18n ?
  const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);

  if (!additional) {
    return <div className={classNames}>{children}</div>;
  }

  const handleBlur = ({ target }) => onKeyChange(target.value);

  return (
    <div className={classNames}>
      <Row align={toolbarAlign} gutter={rowGutter}>
        <Col className="form-additional" flex="1">
          <div className="form-group">
            <Form.Item
              colon={colon}
              className="form-group"
              hasFeedback
              htmlFor={`${id}-key`}
              label={keyLabel}
              labelCol={labelCol}
              required={required}
              style={wrapperStyle}
              wrapperCol={wrapperCol}
            >
              <Input
                className="form-control"
                defaultValue={label}
                disabled={disabled || (readonlyAsDisabled && readonly)}
                id={`${id}-key`}
                name={`${id}-key`}
                onBlur={!readonly ? handleBlur : undefined}
                style={INPUT_STYLE}
                type="text"
              />
            </Form.Item>
          </div>
        </Col>
        <Col className="form-additional" flex="1">
          {children}
        </Col>
        <Col flex="192px">
          <Button
            block
            className="array-item-remove"
            danger
            disabled={disabled || readonly}
            icon={<DeleteOutlined />}
            onClick={onDropPropertyClick(label)}
            type="primary"
          />
        </Col>
      </Row>
    </div>
  );
};

export default WrapIfAdditional;
