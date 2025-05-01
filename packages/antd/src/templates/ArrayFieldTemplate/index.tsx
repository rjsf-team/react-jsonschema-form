import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldItemTemplateType,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  buttonId,
} from '@rjsf/utils';
import classNames from 'classnames';
import { Col, Row, ConfigProvider } from 'antd';
import { useContext } from 'react';

const DESCRIPTION_COL_STYLE = {
  paddingBottom: '8px',
};

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    className,
    disabled,
    formContext,
    idSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const { labelAlign = 'right', rowGutter = 24 } = formContext as GenericObjectType;

  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('form');
  const labelClsBasic = `${prefixCls}-item-label`;
  const labelColClassName = classNames(
    labelClsBasic,
    labelAlign === 'left' && `${labelClsBasic}-left`,
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
              schema={schema}
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
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Col>
        )}
        <Col className='row array-item-list' span={24}>
          {items &&
            items.map(({ key, ...itemProps }: ArrayFieldItemTemplateType<T, S, F>) => (
              <ArrayFieldItemTemplate key={key} {...itemProps} />
            ))}
        </Col>

        {canAdd && (
          <Col span={24}>
            <Row gutter={rowGutter} justify='end'>
              <Col flex='192px'>
                <AddButton
                  id={buttonId<T>(idSchema, 'add')}
                  className='rjsf-array-item-add'
                  disabled={disabled || readonly}
                  onClick={onAddClick}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </fieldset>
  );
}
