import React from 'react';

import Form from 'antd/lib/form';

import WrapIfAdditional from './WrapIfAdditional';

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

const FieldTemplate = ({
  children,
  classNames,
  description,
  rawDescription,
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
  required,
  schema,
  // uiSchema,
}) => {
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
    antd
  } = formContext;

  const descriptionLocation= antd?.descriptionLocation || 'below';

  const descriptionProps = {};

  switch (descriptionLocation) {
    case 'tooltip':
      descriptionProps.tooltip = rawDescription ? description : undefined;
      break;
    case 'below':
      descriptionProps.extra = description;
      break;
    default:
      break;
  }

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
          hasFeedback={schema.type !== 'array' && schema.type !== 'object'}
          help={(rawHelp ? help : undefined) || (rawErrors ? renderFieldErrors() : undefined)}
          htmlFor={id}
          label={displayLabel && label}
          labelCol={labelCol}
          required={required}
          style={wrapperStyle}
          validateStatus={rawErrors ? 'error' : undefined}
          wrapperCol={wrapperCol}
          {...descriptionProps}
        >
          {children}
        </Form.Item>
      )}
    </WrapIfAdditional>
  );
};

export default FieldTemplate;
