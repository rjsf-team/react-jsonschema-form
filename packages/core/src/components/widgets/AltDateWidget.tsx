import { MouseEvent, useCallback, useEffect, useState } from 'react';
import {
  ariaDescribedByIds,
  dateRangeOptions,
  parseDateString,
  toDateString,
  DateObject,
  type DateElementFormat,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WidgetProps,
  getDateElementProps,
} from '@rjsf/utils';

function readyForChange(state: DateObject) {
  return Object.values(state).every((value) => value !== -1);
}

type DateElementProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> = Pick<
  WidgetProps<T, S, F>,
  'value' | 'name' | 'disabled' | 'readonly' | 'autofocus' | 'registry' | 'onBlur' | 'onFocus'
> & {
  rootId: string;
  select: (property: keyof DateObject, value: any) => void;
  type: string;
  range: [number, number];
};

function DateElement<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  type,
  range,
  value,
  select,
  rootId,
  name,
  disabled,
  readonly,
  autofocus,
  registry,
  onBlur,
  onFocus,
}: DateElementProps<T, S, F>) {
  const id = rootId + '_' + type;
  const { SelectWidget } = registry.widgets;
  return (
    <SelectWidget
      schema={{ type: 'integer' } as S}
      id={id}
      name={name}
      className='form-control'
      options={{ enumOptions: dateRangeOptions<S>(range[0], range[1]) }}
      placeholder={type}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={(value: any) => select(type as keyof DateObject, value)}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      label=''
      aria-describedby={ariaDescribedByIds<T>(rootId)}
    />
  );
}

/** The `AltDateWidget` is an alternative widget for rendering date properties.
 * @param props - The `WidgetProps` for this component
 */
function AltDateWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  time = false,
  disabled = false,
  readonly = false,
  autofocus = false,
  options,
  id,
  name,
  registry,
  onBlur,
  onFocus,
  onChange,
  value,
}: WidgetProps<T, S, F>) {
  const { translateString } = registry;
  const [state, setState] = useState(parseDateString(value, time));

  useEffect(() => {
    setState(parseDateString(value, time));
  }, [time, value]);

  const handleChange = useCallback(
    (property: keyof DateObject, value: string) => {
      const nextState = {
        ...state,
        [property]: typeof value === 'undefined' ? -1 : value,
      };

      if (readyForChange(nextState)) {
        onChange(toDateString(nextState, time));
      } else {
        setState(nextState);
      }
    },
    [state, onChange, time],
  );

  const handleSetNow = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      const nextState = parseDateString(new Date().toJSON(), time);
      onChange(toDateString(nextState, time));
    },
    [disabled, readonly, time, onChange],
  );

  const handleClear = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      onChange(undefined);
    },
    [disabled, readonly, onChange],
  );

  return (
    <ul className='list-inline'>
      {getDateElementProps(
        state,
        time,
        options.yearsRange as [number, number] | undefined,
        options.format as DateElementFormat | undefined,
      ).map((elemProps, i) => (
        <li className='list-inline-item' key={i}>
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
        </li>
      ))}
      {(options.hideNowButton !== 'undefined' ? !options.hideNowButton : true) && (
        <li className='list-inline-item'>
          <a href='#' className='btn btn-info btn-now' onClick={handleSetNow}>
            {translateString(TranslatableString.NowLabel)}
          </a>
        </li>
      )}
      {(options.hideClearButton !== 'undefined' ? !options.hideClearButton : true) && (
        <li className='list-inline-item'>
          <a href='#' className='btn btn-warning btn-clear' onClick={handleClear}>
            {translateString(TranslatableString.ClearLabel)}
          </a>
        </li>
      )}
    </ul>
  );
}

export default AltDateWidget;
