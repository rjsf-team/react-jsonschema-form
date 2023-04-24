import { Input, Slider } from '@mantine/core';

import { ariaDescribedByIds, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps, rangeSpec } from '@rjsf/utils';

export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { id, value, readonly, disabled, onChange, onBlur, onFocus, rawErrors = [], schema } = props;
  const hasErrors = rawErrors.length > 0;

  const _onChange = (value: number) => onChange && onChange(value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <>
      <Slider
        id={id}
        key={id}
        name={id}
        disabled={disabled || readonly}
        {...rangeSpec<S>(schema)}
        value={value}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
      <span>{value}</span>
      {hasErrors &&
        rawErrors.map((error: string, index: number) => (
          <Input.Error key={`range-widget-input-errors-${index}`}>{error}</Input.Error>
        ))}
    </>
  );
}
