import React from "react";
import classNames from "classnames";
import isObject from "lodash/isObject";
import isNumber from "lodash/isNumber";
import isString from "lodash/isString";
import {
  canExpand,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  RJSFSchema,
  UiSchema,
  GenericObjectType,
} from "@rjsf/utils";
import Col from "antd/lib/col";
import Row from "antd/lib/row";
import { withConfigConsumer } from "antd/lib/config-provider/context";

const DESCRIPTION_COL_STYLE = {
  paddingBottom: "8px",
};

// Add in the `prefixCls` element needed by the `withConfigConsumer` HOC
export type AntdObjectFieldTemplateProps = ObjectFieldTemplateProps & {
  prefixCls: string;
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
}: AntdObjectFieldTemplateProps) => {
  const uiOptions = getUiOptions(uiSchema);
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate">(
    "TitleFieldTemplate",
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<"DescriptionFieldTemplate">(
    "DescriptionFieldTemplate",
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const { colSpan = 24, labelAlign = "right", rowGutter = 24 } = formContext;

  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = classNames(
    labelClsBasic,
    labelAlign === "left" && `${labelClsBasic}-left`
    // labelCol.className,
  );

  const findSchema = (element: ObjectFieldTemplatePropertyType): RJSFSchema =>
    element.content.props.schema;

  const findSchemaType = (element: ObjectFieldTemplatePropertyType) =>
    findSchema(element).type;

  const findUiSchema = (
    element: ObjectFieldTemplatePropertyType
  ): UiSchema | undefined => element.content.props.uiSchema;

  const findUiSchemaField = (element: ObjectFieldTemplatePropertyType) =>
    getUiOptions(findUiSchema(element)).field;

  const findUiSchemaWidget = (element: ObjectFieldTemplatePropertyType) =>
    getUiOptions(findUiSchema(element)).widget;

  const calculateColSpan = (element: ObjectFieldTemplatePropertyType) => {
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
      const colSpanObj: GenericObjectType = colSpan;
      if (isString(widget)) {
        return colSpanObj[widget];
      }
      if (isString(field)) {
        return colSpanObj[field];
      }
      if (isString(type)) {
        return colSpanObj[type];
      }
    }
    if (isNumber(colSpan)) {
      return colSpan;
    }
    return defaultColSpan;
  };

  return (
    <fieldset id={idSchema.$id}>
      <Row gutter={rowGutter}>
        {(uiOptions.title || title) && (
          <Col className={labelColClassName} span={24}>
            <TitleFieldTemplate
              id={`${idSchema.$id}-title`}
              required={required}
              title={uiOptions.title || title}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}
        {(uiOptions.description || description) && (
          <Col span={24} style={DESCRIPTION_COL_STYLE}>
            <DescriptionFieldTemplate
              description={uiOptions.description || description!}
              id={`${idSchema.$id}-description`}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}
        {properties
          .filter((e) => !e.hidden)
          .map((element: ObjectFieldTemplatePropertyType) => (
            <Col key={element.name} span={calculateColSpan(element)}>
              {element.content}
            </Col>
          ))}
      </Row>

      {canExpand(schema, uiSchema, formData) && (
        <Col span={24}>
          <Row gutter={rowGutter} justify="end">
            <Col flex="192px">
              <AddButton
                className="object-property-expand"
                disabled={disabled || readonly}
                onClick={onAddClick(schema)}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Col>
          </Row>
        </Col>
      )}
    </fieldset>
  );
};

export default withConfigConsumer<AntdObjectFieldTemplateProps>({
  prefixCls: "form",
})(ObjectFieldTemplate);
