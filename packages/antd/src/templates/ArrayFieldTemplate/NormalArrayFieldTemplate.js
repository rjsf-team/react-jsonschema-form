import React from 'react';
import classNames from 'classnames';

import Button from 'antd/lib/button';
import Col from 'antd/lib/col';
import Row from 'antd/lib/row';
import { withConfigConsumer } from 'antd/lib/config-provider/context';
import PlusCircleOutlined from '@ant-design/icons/PlusCircleOutlined';

import ArrayFieldTemplateItem from './ArrayFieldTemplateItem';

const DESCRIPTION_COL_STYLE = {
  paddingBottom: '8px',
};

const NormalArrayFieldTemplate = ({
  canAdd,
  className,
  DescriptionField,
  disabled,
  formContext,
  // formData,
  idSchema,
  items,
  onAddClick,
  prefixCls,
  readonly,
  // registry,
  required,
  schema,
  title,
  TitleField,
  uiSchema,
}) => {
  const { labelAlign = 'right', rowGutter = 24 } = formContext;

  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = classNames(
    labelClsBasic,
    labelAlign === 'left' && `${labelClsBasic}-left`,
    // labelCol.className,
  );

  return (
    <fieldset className={className} id={idSchema.$id}>
      <Row gutter={rowGutter}>
        {title && (
          <Col className={labelColClassName} span={24}>
            <TitleField
              id={`${idSchema.$id}__title`}
              key={`array-field-title-${idSchema.$id}`}
              required={required}
              title={uiSchema['ui:title'] || title}
            />
          </Col>
        )}

        {(uiSchema['ui:description'] || schema.description) && (
          <Col span={24} style={DESCRIPTION_COL_STYLE}>
            <DescriptionField
              description={uiSchema['ui:description'] || schema.description}
              id={`${idSchema.$id}__description`}
              key={`array-field-description-${idSchema.$id}`}
            />
          </Col>
        )}

        <Col className="row array-item-list" span={24}>
          {items && items.map((itemProps) => (
            <ArrayFieldTemplateItem {...itemProps} formContext={formContext} />
          ))}
        </Col>

        {canAdd && (
          <Col span={24}>
            <Row gutter={rowGutter} justify="end">
              <Col flex="192px">
                <Button
                  block
                  className="array-item-add"
                  disabled={disabled || readonly}
                  onClick={onAddClick}
                  type="primary"
                >
                  <PlusCircleOutlined /> Add Item
                </Button>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </fieldset>
  );
};

export default withConfigConsumer({ prefixCls: 'form' })(
  NormalArrayFieldTemplate,
);
