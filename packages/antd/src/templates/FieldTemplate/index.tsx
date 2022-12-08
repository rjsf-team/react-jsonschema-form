import React from "react";
import { FieldTemplateProps } from "@rjsf/utils";
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
  rawDescription,
  rawHelp,
  readonly,
  registry,
  required,
  schema,
  uiSchema,
}: FieldTemplateProps) => {
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
  } = formContext;

  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<"WrapIfAdditionalTemplate">(
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
          extra={rawDescription && description}
          hasFeedback={schema.type !== "array" && schema.type !== "object"}
          help={(!!rawHelp && help) || (rawErrors?.length ? errors : undefined)}
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
