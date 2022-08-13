import classNames from "classnames";
import isObject from "lodash/isObject";
import isNumber from "lodash/isNumber";

import { canExpand, getUiOptions } from "@rjsf/utils";
import Button from "antd/lib/button";
import Col from "antd/lib/col";
import Row from "antd/lib/row";
import { withConfigConsumer } from "antd/lib/config-provider/context";
import PlusCircleOutlined from "@ant-design/icons/PlusCircleOutlined";

const DESCRIPTION_COL_STYLE = {
  paddingBottom: "8px",
};

const ObjectFieldTemplate = ({
  description,
  disabled,
  formContext,
  formData,
  idSchema,
  onAddClick,
  prefixCls,
  properties,
  readonly,
  required,
  registry,
  schema,
  title,
  uiSchema,
}) => {
  const { DescriptionFieldTemplate, TitleFieldTemplate } = registry.templates;
  const { colSpan = 24, labelAlign = "right", rowGutter = 24 } = formContext;
  const uiOptions = getUiOptions(uiSchema);

  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = classNames(
    labelClsBasic,
    labelAlign === "left" && `${labelClsBasic}-left`
    // labelCol.className,
  );

  const findSchema = (element) => element.content.props.schema;

  const findSchemaType = (element) => findSchema(element).type;

  const findUiSchema = (element) => element.content.props.uiSchema;

  const findUiSchemaField = (element) =>
    getUiOptions(findUiSchema(element)).field;

  const findUiSchemaWidget = (element) =>
    getUiOptions(findUiSchema(element)).widget;

  const calculateColSpan = (element) => {
    const type = findSchemaType(element);
    const field = findUiSchemaField(element);
    const widget = findUiSchemaWidget(element);

    const defaultColSpan =
      properties.length < 2 || // Single or no field in object.
      type === "object" ||
      type === "array" ||
      widget === "textarea"
        ? 24
        : 12;

    if (isObject(colSpan)) {
      return (
        colSpan[widget] || colSpan[field] || colSpan[type] || defaultColSpan
      );
    }
    if (isNumber(colSpan)) {
      return colSpan;
    }
    return defaultColSpan;
  };

  return (
    <fieldset id={idSchema.$id}>
      <Row gutter={rowGutter}>
        {uiOptions.title !== false && (uiOptions.title || title) && (
          <Col className={labelColClassName} span={24}>
            <TitleFieldTemplate
              id={`${idSchema.$id}-title`}
              required={required}
              title={uiOptions.title || title}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}
        {uiOptions.description !== false &&
          (uiOptions.description || description) && (
            <Col span={24} style={DESCRIPTION_COL_STYLE}>
              <DescriptionFieldTemplate
                description={uiOptions.description || description}
                id={`${idSchema.$id}-description`}
                registry={registry}
              />
            </Col>
          )}
        {properties
          .filter((e) => !e.hidden)
          .map((element) => (
            <Col key={element.name} span={calculateColSpan(element)}>
              {element.content}
            </Col>
          ))}
      </Row>

      {canExpand(schema, uiSchema, formData) && (
        <Col span={24}>
          <Row gutter={rowGutter} justify="end">
            <Col flex="192px">
              <Button
                block
                className="object-property-expand"
                disabled={disabled || readonly}
                onClick={onAddClick(schema)}
                type="primary"
              >
                <PlusCircleOutlined /> Add Item
              </Button>
            </Col>
          </Row>
        </Col>
      )}
    </fieldset>
  );
};

export default withConfigConsumer({ prefixCls: "form" })(ObjectFieldTemplate);
