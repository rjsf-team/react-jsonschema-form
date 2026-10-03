import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { DateElement, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';
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
  } = props;
  const { formContext, translateString } = registry;
  const { rowGutter = 24 } = formContext as GenericObjectType;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps(props);

  return (
    <Row gutter={[Math.floor(rowGutter / 2), Math.floor(rowGutter / 2)]}>
      {elements.map((elemProps, i) => {
        const elemId = `${id}_${elemProps.type}`;
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
            />
          </Col>
        );
      })}
      {!options.hideNowButton && (
        <Col flex='88px'>
          <Button block className='btn-now' onClick={handleSetNow} type='primary'>
            {translateString(TranslatableString.NowLabel)}
          </Button>
        </Col>
      )}
      {!options.hideClearButton && (
        <Col flex='88px'>
          <Button block className='btn-clear' danger onClick={handleClear} type='primary'>
            {translateString(TranslatableString.ClearLabel)}
          </Button>
        </Col>
      )}
    </Row>
  );
}
