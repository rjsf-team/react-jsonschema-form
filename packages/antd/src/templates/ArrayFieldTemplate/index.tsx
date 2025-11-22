import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  buttonId,
} from '@rjsf/utils';
import classNames from 'classnames';
import { Col, Row, ConfigProvider } from 'antd';
import { useContext } from 'react';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateProps` props for the component
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
    fieldPathId,
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;
  const { formContext } = registry;
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
    <fieldset className={className} id={fieldPathId.$id}>
      <Row gutter={rowGutter}>
        {(uiOptions.title || title) && (
          <Col className={labelColClassName} span={24}>
            <ArrayFieldTitleTemplate
              fieldPathId={fieldPathId}
              required={required}
              title={uiOptions.title || title}
              schema={schema}
              uiSchema={uiSchema}
              registry={registry}
              optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
            />
          </Col>
        )}
        <Col className='row array-item-list' span={24}>
          {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
          {items}
        </Col>
        {canAdd && (
          <Col span={24}>
            <Row gutter={rowGutter} justify='end'>
              <Col flex='120px'>
                <AddButton
                  id={buttonId(fieldPathId, 'add')}
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
