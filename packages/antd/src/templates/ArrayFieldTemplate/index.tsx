import React from "react";
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
} from "@rjsf/utils";
import classNames from "classnames";
import Col from "antd/lib/col";
import Row from "antd/lib/row";
import { withConfigConsumer } from "antd/lib/config-provider/context";

const DESCRIPTION_COL_STYLE = {
  paddingBottom: "8px",
};

// Add in the `prefixCls` element needed by the `withConfigConsumer` HOC
export type AntdArrayFieldTemplateProps = ArrayFieldTemplateProps & {
  prefixCls: string;
};

const ArrayFieldTemplate = ({
  canAdd,
  className,
  disabled,
  formContext,
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
}: AntdArrayFieldTemplateProps) => {
  const uiOptions = getUiOptions(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate(
    "ArrayFieldDescriptionTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate<"ArrayFieldItemTemplate">(
    "ArrayFieldItemTemplate",
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<"ArrayFieldTitleTemplate">(
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
              description={uiOptions.description || schema.description || ""}
              idSchema={idSchema}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}

        <Col className="row array-item-list" span={24}>
          {items &&
            items.map(({ key, ...itemProps }) => (
              <ArrayFieldItemTemplate key={key} {...itemProps} />
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
                  uiSchema={uiSchema}
                />
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </fieldset>
  );
};

export default withConfigConsumer<AntdArrayFieldTemplateProps>({
  prefixCls: "form",
})(ArrayFieldTemplate);
