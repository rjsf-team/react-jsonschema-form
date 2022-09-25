import React, { MouseEvent, useEffect, useState } from "react";
import {
  DateObject,
  pad,
  parseDateString,
  toDateString,
  WidgetProps,
} from "@rjsf/utils";
import { Box, Button } from "@chakra-ui/react";

const rangeOptions = (start: number, stop: number) => {
  const options = [];
  for (let i = start; i <= stop; i++) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
};

interface AltDateStateType extends DateObject {
  [x: string]: number | undefined;
}

const readyForChange = (state: AltDateStateType) => {
  return Object.keys(state).every(
    (key) => typeof state[key] !== "undefined" && state[key] !== -1
  );
};

const AltDateWidget = (props: any) => {
  const {
    autofocus,
    disabled,
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
  const { SelectWidget } = registry.widgets;
  const [state, setState] = useState(parseDateString(value, showTime));
  useEffect(() => {
    setState(parseDateString(value, showTime));
  }, [showTime, value]);

  const handleChange = (property: string, nextValue: string) => {
    const nextState = {
      ...state,
      [property]: typeof nextValue === "undefined" ? -1 : nextValue,
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

  const dateElementProps = () => {
    const { year, month, day, hour, minute, second } = state;

    const data: { type: string; range: any; value?: number }[] = [
      { type: "year", range: options.yearsRange, value: year },
      { type: "month", range: [1, 12], value: month },
      { type: "day", range: [1, 31], value: day },
    ];

    if (showTime) {
      data.push(
        { type: "hour", range: [0, 23], value: hour },
        { type: "minute", range: [0, 59], value: minute },
        { type: "second", range: [0, 59], value: second }
      );
    }

    return data;
  };

  const renderDateElement = (elemProps: WidgetProps) => {
    const value = elemProps.value ? elemProps.value : undefined;
    return (
      <SelectWidget
        {...elemProps}
        label={undefined}
        className="form-control"
        onChange={(elemValue: WidgetProps) =>
          elemProps.select(elemProps.type, elemValue)
        }
        options={{
          enumOptions: rangeOptions(elemProps.range[0], elemProps.range[1]),
        }}
        placeholder={elemProps.type}
        schema={{ type: "integer" }}
        value={value}
      />
    );
  };

  return (
    <Box>
      <Box display="flex" flexWrap="wrap" alignItems="center" justify="center">
        {dateElementProps().map((elemProps: any, i) => {
          const elemId = id + "_" + elemProps.type;
          return (
            <Box key={elemId} mr="2" mb="2">
              {renderDateElement({
                ...props,
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
                value: elemProps.value < 0 ? "" : elemProps.value,
              })}
            </Box>
          );
        })}
      </Box>
      <Box display="flex">
        {!options.hideNowButton && (
          <Button
            onClick={(e: MouseEvent<HTMLButtonElement>) => handleNow(e)}
            mr="2"
          >
            Now
          </Button>
        )}
        {!options.hideClearButton && (
          <Button
            onClick={(e: MouseEvent<HTMLButtonElement>) => handleClear(e)}
          >
            Clear
          </Button>
        )}
      </Box>
    </Box>
  );
};

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
