import { MouseEvent, useEffect, useState } from 'react';
import { Row, Col, Button } from 'antd';
import {
  ariaDescribedByIds,
  dateRangeOptions,
  getDateElementProps,
  parseDateString,
  toDateString,
  DateObject,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WidgetProps,
  DateElementFormat,
} from '@rjsf/utils';

type DateElementProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> = Pick<
  WidgetProps<T, S, F>,
  'id' | 'name' | 'value' | 'disabled' | 'readonly' | 'autofocus' | 'registry' | 'onBlur' | 'onFocus'
> & {
  select: (property: keyof DateObject, value: any) => void;
  type: string;
  range: [number, number];
};

const readyForChange = (state: DateObject) => {
  return Object.values(state).every((value) => value !== -1);
};

export default function AltDateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    formContext,
    id,
    onBlur,
    onChange,
    onFocus,
    options,
    readonly,
    registry,
    showTime,
    value,
  } = props;
  const { translateString, widgets } = registry;
  const { SelectWidget } = widgets;
  const { rowGutter = 24 } = formContext as GenericObjectType;

  const [state, setState] = useState(parseDateString(value, showTime));

  useEffect(() => {
    setState(parseDateString(value, showTime));
  }, [showTime, value]);

  const handleChange = (property: keyof DateObject, nextValue: any) => {
    const nextState = {
      ...state,
      [property]: typeof nextValue === 'undefined' ? -1 : nextValue,
    };

    if (readyForChange(nextState)) {
      onChange(toDateString(nextState, showTime));
    } else {
      setState(nextState);
    }
  };

  const handleNow = (event: MouseEvent) => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    const nextState = parseDateString(new Date().toJSON(), showTime);
    onChange(toDateString(nextState, showTime));
  };

  const handleClear = (event: MouseEvent) => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    onChange(undefined);
  };

  const renderDateElement = (elemProps: DateElementProps<T, S, F>) => (
    <SelectWidget
      autofocus={elemProps.autofocus}
      className='form-control'
      disabled={elemProps.disabled}
      id={elemProps.id}
      name={elemProps.name}
      onBlur={elemProps.onBlur}
      onChange={(elemValue) => elemProps.select(elemProps.type as keyof DateObject, elemValue)}
      onFocus={elemProps.onFocus}
      options={{
        enumOptions: dateRangeOptions<S>(elemProps.range[0], elemProps.range[1]),
      }}
      placeholder={elemProps.type}
      readonly={elemProps.readonly}
      schema={{ type: 'integer' } as S}
      value={elemProps.value}
      registry={registry}
      label=''
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );

  return (
    <Row gutter={[Math.floor(rowGutter / 2), Math.floor(rowGutter / 2)]}>
      {getDateElementProps(
        state,
        showTime,
        options.yearsRange as [number, number] | undefined,
        options.format as DateElementFormat | undefined
      ).map((elemProps, i) => {
        const elemId = id + '_' + elemProps.type;
        return (
          <Col flex='88px' key={elemId}>
            {renderDateElement({
              ...elemProps,
              autofocus: autofocus && i === 0,
              disabled,
              id: elemId,
              name: id,
              onBlur,
              onFocus,
              readonly,
              registry,
              select: handleChange,
              // NOTE: antd components accept -1 rather than issue a warning
              // like material-ui, so we need to convert -1 to undefined here.
              value: elemProps.value || -1 < 0 ? undefined : elemProps.value,
            })}
          </Col>
        );
      })}
      {!options.hideNowButton && (
        <Col flex='88px'>
          <Button block className='btn-now' onClick={handleNow} type='primary'>
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

AltDateWidget.defaultProps = {
  autofocus: false,
  disabled: false,
  options: {
    yearsRange: [1900, new Date().getFullYear() + 2],
  },
  readonly: false,
  showTime: false,
};
