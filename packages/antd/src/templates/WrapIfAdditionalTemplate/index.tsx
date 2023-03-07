import { FocusEvent } from 'react';
import Col from 'antd/lib/col';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Row from 'antd/lib/row';
import {
  ADDITIONAL_PROPERTY_FLAG,
  UI_OPTIONS_KEY,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

const INPUT_STYLE = {
  width: '100%',
};

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
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
  } = props;
  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    readonlyAsDisabled = true,
    rowGutter = 24,
    toolbarAlign = 'top',
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
  } = registry.formContext;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);

  // The `block` prop is not part of the `IconButtonProps` defined in the template, so put it into the uiSchema instead
  const uiOptions = uiSchema ? uiSchema[UI_OPTIONS_KEY] : {};
  const buttonUiOptions = {
    ...uiSchema,
    [UI_OPTIONS_KEY]: { ...uiOptions, block: true },
  };

  return (
    <div className={classNames} style={style}>
      <Row align={toolbarAlign} gutter={rowGutter}>
        <Col className='form-additional' flex='1'>
          <div className='form-group'>
            <Form.Item
              colon={colon}
              className='form-group'
              hasFeedback
              htmlFor={`${id}-key`}
              label={keyLabel}
              labelCol={labelCol}
              required={required}
              style={wrapperStyle}
              wrapperCol={wrapperCol}
            >
              <Input
                className='form-control'
                defaultValue={label}
                disabled={disabled || (readonlyAsDisabled && readonly)}
                id={`${id}-key`}
                name={`${id}-key`}
                onBlur={!readonly ? handleBlur : undefined}
                style={INPUT_STYLE}
                type='text'
              />
            </Form.Item>
          </div>
        </Col>
        <Col className='form-additional' flex='1'>
          {children}
        </Col>
        <Col flex='192px'>
          <RemoveButton
            className='array-item-remove'
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
            uiSchema={buttonUiOptions}
            registry={registry}
          />
        </Col>
      </Row>
    </div>
  );
}
