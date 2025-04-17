import { MouseEvent, useEffect, useState } from 'react';
import {
  ariaDescribedByIds,
  dateRangeOptions,
  DateElementFormat,
  DateObject,
  FormContextType,
  getDateElementProps,
  parseDateString,
  RJSFSchema,
  StrictRJSFSchema,
  toDateString,
  TranslatableString,
  WidgetProps,
} from '@rjsf/utils';
import { Box, Button } from '@chakra-ui/react';

function DateElement<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { SelectWidget } = props.registry.widgets;
  const value = props.value ? props.value : undefined;
  return (
    <SelectWidget
      {...props}
      label={''}
      className='form-control'
      onChange={(elemValue: WidgetProps<T, S, F>) => props.select(props.type, elemValue)}
      options={{
        enumOptions: dateRangeOptions<S>(props.range[0], props.range[1]),
      }}
      placeholder={props.type}
      schema={{ type: 'integer' } as S}
      value={value}
      aria-describedby={ariaDescribedByIds<T>(props.name)}
    />
  );
}

interface AltDateStateType extends DateObject {
  [x: string]: number | undefined;
}

const readyForChange = (state: AltDateStateType) => {
  return Object.keys(state).every((key) => typeof state[key] !== 'undefined' && state[key] !== -1);
};

function AltDateWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { autofocus, disabled, id, onBlur, onChange, onFocus, options, readonly, registry, showTime, value } = props;
  const { translateString } = registry;
  const [state, setState] = useState(parseDateString(value, showTime));
  useEffect(() => {
    setState(parseDateString(value, showTime));
  }, [showTime, value]);

  const handleChange = (property: string, nextValue: string) => {
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

  const handleNow = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    const nextState = parseDateString(new Date().toJSON(), showTime);
    onChange(toDateString(nextState, showTime));
  };

  const handleClear = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    onChange(undefined);
  };

  return (
    <Box>
      <Box display='flex' flexWrap='wrap' alignItems='center'>
        {getDateElementProps(
          state,
          showTime,
          options.yearsRange as [number, number] | undefined,
          options.format as DateElementFormat | undefined,
        ).map((elemProps: any, i) => {
          const elemId = id + '_' + elemProps.type;
          return (
            <Box key={elemId} mr='2' mb='2'>
              <DateElement<T, S, F>
                {...props}
                {...elemProps}
                autofocus={autofocus && i === 0}
                disabled={disabled}
                id={elemId}
                name={id}
                onBlur={onBlur}
                onFocus={onFocus}
                readonly={readonly}
                registry={registry}
                select={handleChange}
                value={elemProps.value < 0 ? '' : elemProps.value}
              />
            </Box>
          );
        })}
      </Box>
      <Box display='flex'>
        {!options.hideNowButton && (
          <Button onClick={(e: MouseEvent<HTMLButtonElement>) => handleNow(e)} mr='2'>
            {translateString(TranslatableString.NowLabel)}
          </Button>
        )}
        {!options.hideClearButton && (
          <Button onClick={(e: MouseEvent<HTMLButtonElement>) => handleClear(e)}>
            {translateString(TranslatableString.ClearLabel)}
          </Button>
        )}
      </Box>
    </Box>
  );
}

AltDateWidget.defaultProps = {
  autofocus: false,
  disabled: false,
  readonly: false,
  showTime: false,
  options: {
    yearsRange: [1900, new Date().getFullYear() + 2],
  },
};

export default AltDateWidget;
