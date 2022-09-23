import React from "react";

import Form from "antd/lib/form";

import { getUiOptions, getTemplate } from "@rjsf/utils";

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

const FieldTemplate = ({
  children,
  classNames,
  description,
  disabled,
  displayLabel,
  errors,
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
  uiSchema,
}) => {
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
  } = formContext;

  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions
  );

  if (hidden) {
    return <div className="field-hidden">{children}</div>;
  }

  return (
    <WrapIfAdditionalTemplate
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
      uiSchema={uiSchema}
      registry={registry}
    >
      {id === "root" ? (
        children
      ) : (
        <Form.Item
          colon={colon}
          extra={description}
          hasFeedback={schema.type !== "array" && schema.type !== "object"}
          help={(!!rawHelp && help) || errors}
          htmlFor={id}
          label={displayLabel && label}
          labelCol={labelCol}
          required={required}
          style={wrapperStyle}
          validateStatus={rawErrors?.length ? "error" : undefined}
          wrapperCol={wrapperCol}
        >
          {children}
        </Form.Item>
      )}
    </WrapIfAdditionalTemplate>
  );
};

export default FieldTemplate;
