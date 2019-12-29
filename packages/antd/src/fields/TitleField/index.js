import React from 'react';
// import PropTypes from 'prop-types';
import classNames from 'classnames';

import { FieldProps } from 'react-jsonschema-form';

import { Col } from 'antd';
import { withConfigConsumer } from 'antd/lib/config-provider/context';

const TitleField = ({
  // autofocus,
  // disabled,
  // errorSchema,
  formContext,
  // formData,
  id,
  // idSchema,
  // name,
  // onChange,
  prefixCls,
  // readonly,
  // registry,
  required,
  // schema,
  title,
  // uiSchema,
}) => {
  const {
    colon = true,
    labelAlign = 'right',
    labelCol = {},
  } = formContext;

  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = classNames(
    labelClsBasic,
    labelAlign === 'left' && `${labelClsBasic}-left`,
    labelCol.className,
  );

  let labelChildren = title;
  if (colon && typeof title === 'string' && title.trim() !== '') {
    labelChildren = title.replace(/[：:]\s*$/, '');
  }

  const labelClassName = classNames({
    [`${prefixCls}-item-required`]: required,
    [`${prefixCls}-item-no-colon`]: !colon,
  });

  const handleLabelClick = () => {
    if (!id) {
      return;
    }

    const control = document.querySelector(`[id="${id}"]`);
    if (control && control.focus) {
      control.focus();
    }
  };

  return title ? (
    <Col {...labelCol} className={labelColClassName}>
      <label
        className={labelClassName}
        htmlFor={id}
        onClick={handleLabelClick}
        title={typeof title === 'string' ? title : ''}
      >
        {labelChildren}
      </label>
    </Col>
  ) : null;
};

TitleField.propTypes = FieldProps;

TitleField.defaultProps = {
  formContext: {},
};

export default withConfigConsumer({ prefixCls: 'form' })(TitleField);
