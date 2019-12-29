import React from 'react';
// import PropTypes from 'prop-types';
// import _ from 'lodash';

import { FieldTemplateProps } from 'react-jsonschema-form';

import { Form } from 'antd';

const FieldTemplate = ({
  children,
  classNames,
  description,
  // disabled,
  displayLabel,
  // errors,
  // fields,
  formContext,
  help,
  hidden,
  id,
  label,
  rawDescription,
  rawErrors,
  rawHelp,
  // readonly,
  required,
  schema,
  // uiSchema,
}) => {
  const { colon, labelCol, wrapperCol, wrapperStyle } = formContext;

  if (hidden) {
    return <div className="field-hidden">{children}</div>;
  }

  const renderFieldErrors = () =>
    rawErrors.map(error => (
      <div key={`field-${id}-error-${error}`}>{error}</div>
    ));

  return id === 'root' ? (
    children
  ) : (
    <Form.Item
      className={classNames}
      colon={colon}
      extra={!!rawDescription && description}
      hasFeedback={schema.type !== 'array' && schema.type !== 'object'}
      help={(!!rawHelp && help) || (!!rawErrors && renderFieldErrors())}
      htmlFor={id}
      label={displayLabel && label}
      labelCol={labelCol}
      required={required}
      style={wrapperStyle}
      // validateStatus={validateStatus}
      validateStatus={rawErrors ? 'error' : undefined}
      wrapperCol={wrapperCol}
    >
      {children}
    </Form.Item>
  );
};

FieldTemplate.propTypes = FieldTemplateProps;

export default FieldTemplate;
