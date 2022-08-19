import React from "react";
import { getTemplate, getUiOptions } from "@rjsf/utils";
import classNames from "classnames";
import Col from "antd/lib/col";
import Row from "antd/lib/row";
import { withConfigConsumer } from "antd/lib/config-provider/context";

const DESCRIPTION_COL_STYLE = {
  paddingBottom: "8px",
};

const ArrayFieldTemplate = ({
  canAdd,
  className,
  disabled,
  formContext,
  // formData,
  idSchema,
  items,
  onAddClick,
  prefixCls,
  readonly,
  registry,
  required,
  schema,
  title,
  uiSchema,
}) => {
  const uiOptions = getUiOptions(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate(
    "ArrayFieldDescriptionTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate(
    "ArrayFieldTitleTemplate",
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const { labelAlign = "right", rowGutter = 24 } = formContext;

  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = classNames(
    labelClsBasic,
    labelAlign === "left" && `${labelClsBasic}-left`
    // labelCol.className,
  );

  return (
    <fieldset className={className} id={idSchema.$id}>
      <Row gutter={rowGutter}>
        {(uiOptions.title || title) && (
          <Col className={labelColClassName} span={24}>
            <ArrayFieldTitleTemplate
              idSchema={idSchema}
              required={required}
              title={uiOptions.title || title}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}

        {(uiOptions.description || schema.description) && (
          <Col span={24} style={DESCRIPTION_COL_STYLE}>
            <ArrayFieldDescriptionTemplate
              description={uiOptions.description || schema.description}
              idSchema={idSchema}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}

        <Col className="row array-item-list" span={24}>
          {items &&
            items.map((itemProps) => (
              <ArrayFieldItemTemplate
                {...itemProps}
                formContext={formContext}
              />
            ))}
        </Col>

        {canAdd && (
          <Col span={24}>
            <Row gutter={rowGutter} justify="end">
              <Col flex="192px">
                <AddButton
                  className="array-item-add"
                  disabled={disabled || readonly}
                  onClick={onAddClick}
                />
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </fieldset>
  );
};

export default withConfigConsumer({ prefixCls: "form" })(ArrayFieldTemplate);
