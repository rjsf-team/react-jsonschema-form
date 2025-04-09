import { useCallback } from 'react';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import dayjs from 'dayjs';
import { DateInput } from '@mantine/dates';

const dateParser = (input: string, format: string) => {
  if (!input) {
    return null;
  }
  const d = dayjs(input, format);
  return d.isValid() ? d.toDate() : null;
};

const dateFormat = (date?: Date, format?: string) => {
  if (!date) {
    return '';
  }
  return dayjs(date).format(format || 'YYYY-MM-DD');
};

export default function DateTimeInput<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    name,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    options,
    onChange,
    onBlur,
    onFocus,
    valueFormat,
    displayFormat,
  } = props;

  const emptyValue = options?.emptyValue ?? '';

  const handleChange = useCallback(
    (nextValue: any) => {
      onChange(dateFormat(nextValue, valueFormat as string));
    },
    [onChange, emptyValue]
  );

  const handleBlur = () => onBlur && onBlur(id, value);

  const handleFocus = () => onFocus && onFocus(id, value);

  return (
    <DateInput
      id={id}
      name={name}
      value={dateParser(value, valueFormat as string)}
      dateParser={(v) => dateParser(v, displayFormat as string)}
      placeholder={placeholder || undefined}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      {...options}
      aria-describedby={ariaDescribedByIds<T>(id)}
      popoverProps={{ withinPortal: false }}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
      valueFormat={displayFormat}
    />
  );
}
