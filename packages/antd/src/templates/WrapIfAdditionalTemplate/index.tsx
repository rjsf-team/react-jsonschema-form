import type {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import {
  AdditionalPropertyKeySelect,
  ADDITIONAL_PROPERTY_FLAG,
  UI_OPTIONS_KEY,
  TranslatableString,
  buttonId,
} from '@rjsf/utils';
import { Col, Row, Form, Input } from 'antd';

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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    id,
    label,
    keyName,
    onRemoveProperty,
    onKeyRename,
    onKeyRenameBlur,
    propertyNamesEnum,
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

  // The `block` prop is not part of the `IconButtonProps` defined in the template, so put it into the uiSchema instead
  const baseUiSchema: UiSchema<T, S, F> = uiSchema ?? {};
  const buttonUiOptions: UiSchema<T, S, F> = {
    ...baseUiSchema,
    [UI_OPTIONS_KEY]: { ...baseUiSchema[UI_OPTIONS_KEY], block: true },
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
              label={displayLabel ? keyLabel : undefined}
              labelCol={labelCol}
              required={required}
              style={wrapperStyle}
              wrapperCol={wrapperCol}
            >
              {propertyNamesEnum ? (
                <AdditionalPropertyKeySelect<T, S, F>
                  id={`${id}-key`}
                  label={keyLabel}
                  hideLabel
                  value={keyName}
                  propertyNamesEnum={propertyNamesEnum}
                  onKeyRename={onKeyRename}
                  disabled={disabled || (readonlyAsDisabled && readonly)}
                  readonly={readonly}
                  required={required}
                  registry={registry}
                />
              ) : (
                <Input
                  key={keyName}
                  className='form-control'
                  defaultValue={keyName}
                  disabled={disabled || (readonlyAsDisabled && readonly)}
                  id={`${id}-key`}
                  name={`${id}-key`}
                  onBlur={!readonly ? onKeyRenameBlur : undefined}
                  style={INPUT_STYLE}
                  type='text'
                />
              )}
            </Form.Item>
          </div>
        </Col>
        <Col className='form-additional' flex='1'>
          {children}
        </Col>
        <Col flex='120px' style={{ marginTop: displayLabel ? '40px' : undefined }}>
          <RemoveButton
            id={buttonId(id, 'remove')}
            className='rjsf-object-property-remove'
            disabled={disabled || readonly}
            onClick={onRemoveProperty}
            uiSchema={buttonUiOptions}
            registry={registry}
          />
        </Col>
      </Row>
    </div>
  );
}
