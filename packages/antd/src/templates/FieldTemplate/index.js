import React from 'react';

import Form from 'antd/lib/form';

import WrapIfAdditional from './WrapIfAdditional';

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

const FieldTemplate = ({
  children,
  classNames,
  description,
  disabled,
  displayLabel,
  // errors,
  // fields,
  formContext,
  help,
  hidden,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  rawErrors,
  rawHelp,
  readonly,
  registry,
  required,
  schema,
  // uiSchema,
}) => {
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
  } = formContext;

  if (hidden) {
    return <div className="field-hidden">{children}</div>;
  }

  const renderFieldErrors = () =>
    [...new Set(rawErrors)].map((error) => (
      <div key={`field-${id}-error-${error}`}>{error}</div>
    ));

  return (
    <WrapIfAdditional
      classNames={classNames}
      disabled={disabled}
      formContext={formContext}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
    >
      {id === 'root' ? (
        children
      ) : (
        <Form.Item
          colon={colon}
          extra={description}
          hasFeedback={schema.type !== 'array' && schema.type !== 'object'}
          help={(!!rawHelp && help) || (!!rawErrors && renderFieldErrors())}
          htmlFor={id}
          label={displayLabel && label}
          labelCol={labelCol}
          required={required}
          style={wrapperStyle}
          validateStatus={rawErrors ? 'error' : undefined}
          wrapperCol={wrapperCol}
        >
          {children}
        </Form.Item>
      )}
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
