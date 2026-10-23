import { useContext } from 'react';
import type {
  FormContextType,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  canExpand,
  getByPath,
  getFieldTypeForWidget,
  getTemplates,
  getUiOptions,
  isComponentType,
  resolveUiSchema,
  titleId,
  buttonId,
  titleDrawsOptionalDataControl,
} from '@rjsf/utils';
import { Col, Row, ConfigProvider } from 'antd';
import type { RowProps } from 'antd';
import classNames from 'classnames';

/** Whether `span` is a span antd's `Col` renders, which is a whole number of its 24 grid columns */
function isColSpan(span: unknown): span is number {
  return typeof span === 'number' && Number.isInteger(span) && span >= 0 && span <= 24;
}

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    disabled,
    formData,
    id,
    onAddProperty,
    optionalDataControl,
    properties,
    readonly,
    required,
    registry,
    schema,
    title,
    uiSchema,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { TitleFieldTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const { formContext } = registry;
  const showOptionalDataControlInTitle = titleDrawsOptionalDataControl<T, S, F>(props);
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const antdContext: {
    colSpan?: number | Record<string, number>;
    labelAlign?: string;
    rowGutter?: RowProps['gutter'];
  } = formContext;
  const { colSpan = 24, labelAlign = 'right', rowGutter = 24 } = antdContext;

  const visibleProperties = properties.filter((e) => !e.hidden);

  const calculateColSpan = (element: ObjectFieldTemplatePropertyType<T, S, F>) => {
    if (isColSpan(colSpan)) {
      return colSpan;
    }
    // Resolved the way `SchemaField` resolves them before it picks the field, so that a `$ref` with a
    // `ui:definitions` entry, or an `allOf`, is keyed by what is rendered
    const { schema: rawSchema, uiSchema: rawUiSchema } = element.content.props;
    const propertyFormData = getByPath<T>(formData, element.name);
    const propertySchema: S = registry.schemaUtils.retrieveSchema(rawSchema, propertyFormData);
    const propertyUiSchema: UiSchema<T, S, F> = resolveUiSchema<T, S, F>(rawSchema, rawUiSchema, registry);
    const propertyUiOptions = getUiOptions<T, S, F>(propertyUiSchema);
    // The select `SchemaField` infers for a boolean with labelled options is not modelled here (see #5516)
    const { widget, field: uiField } = propertyUiOptions;
    const type = getFieldTypeForWidget<S>(propertySchema, widget);
    // The `ui:field` names the rendered field, as `SchemaField` resolves it, only when it names a registered one; the map
    // is keyed by name, so a field given as a component has no entry
    const field =
      typeof uiField === 'string' && isComponentType(getByPath(registry.fields, uiField)) ? uiField : undefined;

    const defaultColSpan =
      visibleProperties.length < 2 || // Single or no visible field in object.
      type === 'object' ||
      type === 'array' ||
      widget === 'textarea'
        ? 24
        : 12;

    if (typeof colSpan === 'object' && colSpan !== null) {
      for (const key of [widget, field, type]) {
        if (typeof key === 'string' && isColSpan(colSpan[key])) {
          return colSpan[key];
        }
      }
    }
    return defaultColSpan;
  };

  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('form');
  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = classNames(
    labelClsBasic,
    labelAlign === 'left' && `${labelClsBasic}-left`,
    // labelCol.className,
  );

  return (
    <fieldset id={id}>
      <Row gutter={rowGutter}>
        {title && (
          <Col className={labelColClassName} span={24}>
            <TitleFieldTemplate
              id={titleId(id)}
              title={title}
              required={required}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
              optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
            />
          </Col>
        )}
        {!showOptionalDataControlInTitle && optionalDataControl ? (
          <Col span={24}>{optionalDataControl}</Col>
        ) : undefined}
        {visibleProperties.map((element) => (
          <Col key={element.name} span={calculateColSpan(element)}>
            {element.content}
          </Col>
        ))}
      </Row>
      {canExpand(schema, uiSchema, formData) && (
        <Col span={24}>
          <Row gutter={rowGutter} justify='end'>
            <Col flex='120px'>
              <AddButton
                id={buttonId(id, 'add')}
                className='rjsf-object-property-expand'
                disabled={disabled || readonly}
                onClick={onAddProperty}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Col>
          </Row>
        </Col>
      )}
    </fieldset>
  );
}
