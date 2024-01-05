import { MouseEvent, memo, useCallback, useEffect, useReducer, useState } from 'react';
import {
  ariaDescribedByIds,
  parseDateString,
  toDateString,
  pad,
  DateObject,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WidgetProps,
} from '@rjsf/utils';
import Stack from '@mui/joy/Stack';
import Button from '@mui/joy/Button';

function rangeOptions(start: number, stop: number) {
  const options = [];
  for (let i = start; i <= stop; i++) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
}

function readyForChange(state: DateObject) {
  return Object.values(state).every((value) => value !== -1);
}

function dateElementProps(
  state: DateObject,
  time: boolean,
  yearsRange: [number, number] = [1900, new Date().getFullYear() + 2]
) {
  const { year, month, day, hour, minute, second } = state;
  const data = [
    {
      type: 'year',
      range: yearsRange,
      value: year,
    },
    { type: 'month', range: [1, 12], value: month },
    { type: 'day', range: [1, 31], value: day },
  ] as { type: string; range: [number, number]; value: number | undefined }[];
  if (time) {
    data.push(
      { type: 'hour', range: [0, 23], value: hour },
      { type: 'minute', range: [0, 59], value: minute },
      { type: 'second', range: [0, 59], value: second }
    );
  }
  return data;
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
  endDecorator,
}: DateElementProps<T, S, F> & any) {
  const id = rootId + '_' + type;
  const { SelectWidget } = registry.widgets;
  return (
    <SelectWidget
      schema={{ type: 'integer' } as S}
      id={id}
      name={name}
      className='form-control'
      options={{ enumOptions: rangeOptions(range[0], range[1]) }}
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
      endDecorator={endDecorator}
    />
  );
}

const Stacks = memo(
  ({ id, name, handleChange, state, time, options, disabled, readonly, registry, onBlur, onFocus, autofocus }: any) => {
    const dateTimeElements = dateElementProps(state, time, options.yearsRange as [number, number] | undefined);
    if (!dateTimeElements) {
      return null;
    }
    const dateElements = dateTimeElements.slice(0, 3);
    const timeElements = dateTimeElements.slice(3);
    if (time) {
      return (
        <>
          <Stack direction='row' justifyContent='center' alignItems='center' spacing={0.5}>
            {dateElements.map((elemProps, i) => (
              <DateElement
                key={i}
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
            ))}
          </Stack>
          <Stack direction='row' justifyContent='center' alignItems='center' spacing={0.5}>
            {timeElements.map((elemProps, i) => (
              <DateElement
                key={i}
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
            ))}
          </Stack>
        </>
      );
    } else {
      return (
        <Stack direction='row' justifyContent='center' alignItems='center' spacing={0.5}>
          {dateElements.map((elemProps, i) => (
            <DateElement
              key={i}
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
          ))}
        </Stack>
      );
    }
  }
);

/** The `AltDateWidget` is an alternative widget for rendering date properties.
 *
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
  const [lastValue, setLastValue] = useState(value);
  const [state, setState] = useReducer((state: DateObject, action: Partial<DateObject>) => {
    return { ...state, ...action };
  }, parseDateString(value, time));

  useEffect(() => {
    try {
      const stateValue = toDateString(state, time);
      if (readyForChange(state) && stateValue !== value) {
        // The user changed the date to a new valid data via the comboboxes, so call onChange
        onChange(stateValue);
      } else if (lastValue !== value) {
        // We got a new value in the props
        setLastValue(value);
        setState(parseDateString(value, time));
      }
    } catch (e) {
      console.log('AltDateWidget useEffect error', e);
    }
  }, [time, value, onChange, state, lastValue]);

  const handleChange = useCallback((property: keyof DateObject, value: string) => {
    setState({ [property]: value });
  }, []);

  const handleSetNow = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      const nextState = parseDateString(new Date().toJSON(), time);
      onChange(toDateString(nextState, time));
    },
    [disabled, readonly, time]
  );

  const handleClear = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      console.log('AltDateWidget handleClear', disabled, readonly);
      if (disabled || readonly) {
        return;
      }
      onChange(null);
    },
    [disabled, readonly, onChange]
  );

  return (
    <>
      <Stacks
        id={id}
        name={name}
        handleChange={handleChange}
        state={state}
        time={time}
        options={options}
        disabled={disabled}
        readonly={readonly}
        registry={registry}
        onBlur={onBlur}
        onFocus={onFocus}
        autofocus={autofocus}
      />
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={0.5}>
        {(options.hideNowButton !== 'undefined' ? !options.hideNowButton : true) && (
          <Button sx={{ marginTop: '0.375rem !important' }} onClick={handleSetNow}>
            {translateString(TranslatableString.NowLabel)}
          </Button>
        )}
        {(options.hideClearButton !== 'undefined' ? !options.hideClearButton : true) && (
          <Button sx={{ marginTop: '0.375rem !important' }} onClick={handleClear}>
            {translateString(TranslatableString.ClearLabel)}
          </Button>
        )}
      </Stack>
    </>
  );
}

export default AltDateWidget;
