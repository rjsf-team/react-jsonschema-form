import { Row, Col, Button } from 'antd';
import {
  DateElement,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  useAltDateWidgetProps,
  WidgetProps,
} from '@rjsf/utils';

export default function AltDateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  autofocus = false,
  disabled = false,
  options = { yearsRange: [1900, new Date().getFullYear() + 2] },
  readonly = false,
  time = false,
  ...props
}: WidgetProps<T, S, F>) {
  const { id, name, onBlur, onFocus, registry } = props;
  const { formContext, translateString } = registry;
  const { rowGutter = 24 } = formContext as GenericObjectType;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps({ ...props, autofocus, options });

  return (
    <Row gutter={[Math.floor(rowGutter / 2), Math.floor(rowGutter / 2)]}>
      {elements.map((elemProps, i) => {
        const elemId = `${id}_${elemProps.type}`;
        return (
          <Col flex='88px' key={elemId}>
            <DateElement
              rootId={id}
              name={name}
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

// AltDateWidget.defaultProps = {
//   autofocus: false,
//   disabled: false,
//   options: {
//     yearsRange: [1900, new Date().getFullYear() + 2],
//   },
//   readonly: false,
//   time: false,
// };
