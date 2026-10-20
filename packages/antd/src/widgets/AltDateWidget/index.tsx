import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { DateElement, dateElementId, getGroupAttributes, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';
import { Row, Col, Button } from 'antd';

export default function AltDateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus = false,
    disabled = false,
    id,
    label,
    onBlur,
    onFocus,
    options,
    readonly = false,
    registry,
    presentation,
  } = props;
  const { formContext, translateString } = registry;
  const { rowGutter = 24 } = formContext as GenericObjectType;
  const { elements, handleChange, handleClear, handleSetNow, buttonsDisabled } = useAltDateWidgetProps(props);
  // The date parts are a group carrying the field's id, as core's are, named by the template's label, which a `for`
  // can't reach since no part carries that id
  const { group } = getGroupAttributes<T, S, F>({ id, presentation }, 'group');

  return (
    <Row id={id} gutter={[Math.floor(rowGutter / 2), Math.floor(rowGutter / 2)]} {...group}>
      {elements.map((elemProps, i) => {
        const elemId = dateElementId(id, elemProps.type);
        return (
          <Col flex='88px' key={elemId}>
            <DateElement
              rootId={id}
              label={label}
              select={handleChange}
              {...elemProps}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              onFocus={onFocus}
              autofocus={autofocus && i === 0}
              presentation={presentation}
            />
          </Col>
        );
      })}
      {!options.hideNowButton && (
        <Col flex='88px'>
          <Button block className='btn-now' onClick={handleSetNow} type='primary' disabled={buttonsDisabled}>
            {translateString(TranslatableString.NowLabel)}
          </Button>
        </Col>
      )}
      {!options.hideClearButton && (
        <Col flex='88px'>
          <Button block className='btn-clear' danger onClick={handleClear} type='primary' disabled={buttonsDisabled}>
            {translateString(TranslatableString.ClearLabel)}
          </Button>
        </Col>
      )}
    </Row>
  );
}
