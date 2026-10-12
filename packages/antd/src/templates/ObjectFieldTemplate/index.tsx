import { useContext } from 'react';
import type {
  FormContextType,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from '@rjsf/utils';
import {
  canExpand,
  getByPath,
  getFieldTypeForWidget,
  getTemplates,
  getUiOptions,
  isComponentType,
  isFixedItems,
  titleId,
  buttonId,
} from '@rjsf/utils';
import { Col, Row, ConfigProvider } from 'antd';
import type { RowProps } from 'antd';
import classNames from 'classnames';

/** Whether `span` is a span antd's `Col` renders, which is a whole number of its 24 grid columns */
function isColSpan(span: unknown): span is number {
  return typeof span === 'number' && Number.isInteger(span) && span >= 0 && span <= 24;
}

/** Gets the `ui:field` that `SchemaField` renders a property with, resolved the way its `resolveUiField()` resolves
 * one: the property's own `ui:field` when it names a field, and otherwise the one in `ui:globalOptions`, unless the
 * property gives an empty `ui:field` to ask for no field
 *
 * @param ownUiOptions - The property's own UI options, without the global ones
 * @param registry - The registry holding the fields and the global UI options
 * @returns - The `ui:field` that names the rendered field, if one does
 */
function getRenderedUiField<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ownUiOptions: UIOptionsType<T, S, F>,
  registry: Registry<T, S, F>,
): UIOptionsType<T, S, F>['field'] {
  const namesField = (field: unknown) =>
    isComponentType(typeof field === 'string' ? getByPath(registry.fields, field) : field);
  const ownField = ownUiOptions.field;
  if (namesField(ownField)) {
    return ownField;
  }
  if (!ownField && Object.hasOwn(ownUiOptions, 'field')) {
    return undefined;
  }
  const globalField: UIOptionsType<T, S, F>['field'] = registry.globalUiOptions?.field;
  return namesField(globalField) ? globalField : undefined;
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
  const showOptionalDataControlInTitle = !readonly && !disabled;
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
    const propertySchema: S = element.content.props.schema;
    const propertyUiSchema: UiSchema<T, S, F> | undefined = element.content.props.uiSchema;
    const ownUiOptions = getUiOptions<T, S, F>(propertyUiSchema);
    const type = getFieldTypeForWidget<S>(propertySchema, ownUiOptions.widget);
    const field = getRenderedUiField<T, S, F>(ownUiOptions, registry);
    // `BooleanField`, and `ArrayField` for a multi-select or a files array, render a widget from `ui:globalOptions`
    // when the property names none, while `StringField` and `NumberField` only render the property's own
    const readsGlobalWidget =
      !field &&
      (type === 'boolean' ||
        (type === 'array' &&
          (registry.schemaUtils.isMultiSelect(propertySchema) ||
            (!isFixedItems<S>(propertySchema) &&
              registry.schemaUtils.isFilesArray(propertySchema, propertyUiSchema)))));
    const { widget } = readsGlobalWidget ? { ...registry.globalUiOptions, ...ownUiOptions } : ownUiOptions;

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
    if (isColSpan(colSpan)) {
      return colSpan;
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
        {!showOptionalDataControlInTitle ? <Col span={24}>{optionalDataControl}</Col> : undefined}
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
