import React from "react";
import {
  ADDITIONAL_PROPERTY_FLAG,
  UI_OPTIONS_KEY,
  WrapIfAdditionalTemplateProps,
} from "@rjsf/utils";
import Col from "antd/lib/col";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Row from "antd/lib/row";

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

const INPUT_STYLE = {
  width: "100%",
};

const WrapIfAdditionalTemplate = ({
  children,
  classNames,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  registry,
  schema,
  uiSchema,
}: WrapIfAdditionalTemplateProps) => {
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    readonlyAsDisabled = true,
    rowGutter = 24,
    toolbarAlign = "top",
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
  } = registry.formContext;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = registry.templates.ButtonTemplates;

  const keyLabel = `${label} Key`; // i18n ?
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div className={classNames}>{children}</div>;
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onKeyChange(target.value);

  // The `block` prop is not part of the `IconButtonProps` defined in the template, so put it into the uiSchema instead
  const uiOptions = uiSchema ? uiSchema[UI_OPTIONS_KEY] : {};
  const buttonUiOptions = {
    ...uiSchema,
    [UI_OPTIONS_KEY]: { ...uiOptions, block: true },
  };

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
          <RemoveButton
            className="array-item-remove"
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
            uiSchema={buttonUiOptions}
          />
        </Col>
      </Row>
    </div>
  );
};

export default WrapIfAdditionalTemplate;
