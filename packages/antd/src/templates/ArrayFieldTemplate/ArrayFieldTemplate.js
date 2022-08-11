import classNames from "classnames";

import Button from "antd/lib/button";
import Col from "antd/lib/col";
import Row from "antd/lib/row";
import { withConfigConsumer } from "antd/lib/config-provider/context";
import PlusCircleOutlined from "@ant-design/icons/PlusCircleOutlined";

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
  const {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTitleTemplate,
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
        {title && (
          <Col className={labelColClassName} span={24}>
            <ArrayFieldTitleTemplate
              idSchema={idSchema}
              required={required}
              title={uiSchema["ui:title"] || title}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}

        {(uiSchema["ui:description"] || schema.description) && (
          <Col span={24} style={DESCRIPTION_COL_STYLE}>
            <ArrayFieldDescriptionTemplate
              description={uiSchema["ui:description"] || schema.description}
              idSchema={idSchema}
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

export default withConfigConsumer({ prefixCls: "form" })(ArrayFieldTemplate);
