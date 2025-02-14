import { useCallback, useEffect, useState } from 'react';
import {
  ariaDescribedByIds,
  dateRangeOptions,
  parseDateString,
  toDateString,
  getDateElementProps,
  titleId,
  DateObject,
  type DateElementFormat,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WidgetProps,
} from '@rjsf/utils';
import { Flex, Box, Group, Button, Select, Input } from '@mantine/core';

function readyForChange(state: DateObject) {
  return Object.values(state).every((value) => value !== -1);
}

/** The `AltDateWidget` is an alternative widget for rendering date properties.
 * @param props - The `WidgetProps` for this component
 */
function AltDateWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    label,
    hideLabel,
    rawErrors,
    options,
    onChange,
    showTime = false,
    registry,
  } = props;

  const { translateString } = registry;

  const [lastValue, setLastValue] = useState(value);
  const [state, setState] = useState(parseDateString(value, showTime));

  useEffect(() => {
    const stateValue = toDateString(state, showTime);
    if (lastValue !== value) {
      // We got a new value in the props
      setLastValue(value);
      setState(parseDateString(value, showTime));
    } else if (readyForChange(state) && stateValue !== value) {
      // Selected date is ready to be submitted
      onChange(stateValue);
      setLastValue(stateValue);
    }
  }, [showTime, value, onChange, state, lastValue]);

  const handleChange = useCallback((property: keyof DateObject, nextValue: any) => {
    setState((prev) => ({ ...prev, [property]: typeof nextValue === 'undefined' ? -1 : nextValue }));
  }, []);

  const handleSetNow = useCallback(() => {
    if (!disabled && !readonly) {
      const nextState = parseDateString(new Date().toJSON(), showTime);
      onChange(toDateString(nextState, showTime));
    }
  }, [disabled, readonly, showTime]);

  const handleClear = useCallback(() => {
    if (!disabled && !readonly) {
      onChange('');
    }
  }, [disabled, readonly, onChange]);

  return (
    <>
      {!hideLabel && !!label && (
        <Input.Label id={titleId<T>(id)} required={required}>
          {label}
        </Input.Label>
      )}
      <Flex gap='xs' align='center' wrap='nowrap'>
        {getDateElementProps(
          state,
          showTime,
          options.yearsRange as [number, number] | undefined,
          options.format as DateElementFormat | undefined
        ).map((elemProps, i) => {
          const elemId = id + '_' + elemProps.type;
          return (
            <Box key={i}>
              <Select
                id={elemId}
                name={elemId}
                placeholder={elemProps.type}
                disabled={disabled || readonly}
                data={dateRangeOptions<S>(elemProps.range[0], elemProps.range[1]).map((item) => item.value.toString())}
                value={!elemProps.value || elemProps.value < 0 ? null : elemProps.value.toString()}
                onChange={(v) => handleChange(elemProps.type as keyof DateObject, v)}
                searchable={false}
                allowDeselect={false}
                comboboxProps={{ withinPortal: false }}
                aria-describedby={ariaDescribedByIds<T>(elemId)}
              />
            </Box>
          );
        })}
        <Group wrap='nowrap' gap={3}>
          {(options.hideNowButton !== 'undefined' ? !options.hideNowButton : true) && (
            <Button variant='subtle' size='xs' onClick={handleSetNow}>
              {translateString(TranslatableString.NowLabel)}
            </Button>
          )}
          {(options.hideClearButton !== 'undefined' ? !options.hideClearButton : true) && (
            <Button variant='subtle' size='xs' onClick={handleClear}>
              {translateString(TranslatableString.ClearLabel)}
            </Button>
          )}
        </Group>
      </Flex>
      {rawErrors &&
        rawErrors?.length > 0 &&
        rawErrors.map((error: string, index: number) => (
          <Input.Error key={`alt-date-widget-input-errors-${index}`}>{error}</Input.Error>
        ))}
    </>
  );
}

AltDateWidget.defaultProps = {
  showTime: false,
};

export default AltDateWidget;
