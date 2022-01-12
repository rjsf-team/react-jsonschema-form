import React, { useEffect, useState } from "react";

import { utils, WidgetProps } from "@rjsf/core";
import { Box, Button } from "@chakra-ui/react";

const { pad, parseDateString, toDateString } = utils;

const rangeOptions = (start: any, stop: any) => {
  let options = [];
  for (let i = start; i <= stop; i++) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
};

const readyForChange = (state: any) => {
  return Object.keys(state).every(
    key => typeof state[key] !== "undefined" && state[key] !== -1
  );
};

const AltDateWidget = ({
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
}: WidgetProps) => {
  const { select: SelectWidget } = registry.widgets;
  const [state, setState] = useState(parseDateString(value, showTime));
  useEffect(() => {
    setState(parseDateString(value, showTime));
  }, [showTime, value]);

  const handleChange = (property: any, nextValue: any) => {
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

  const handleNow = (event: any) => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    const nextState = parseDateString(new Date().toJSON(), showTime);
    onChange(toDateString(nextState, showTime));
  };

  const handleClear = (event: any) => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    onChange(undefined);
  };

  const dateElementProps = () => {
    const { year, month, day, hour, minute, second } = state;

    const data = [
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
    const value = Boolean(elemProps.value) ? elemProps.value : undefined;
    return (
      // @ts-ignore
      <SelectWidget
        autofocus={elemProps.autofocus}
        className="form-control"
        disabled={elemProps.disabled}
        id={elemProps.id}
        onBlur={elemProps.onBlur}
        onChange={(elemValue: any) =>
          elemProps.select(elemProps.type, elemValue)
        }
        onFocus={elemProps.onFocus}
        options={{
          enumOptions: rangeOptions(elemProps.range[0], elemProps.range[1]),
        }}
        placeholder={elemProps.type}
        readonly={elemProps.readonly}
        schema={{ type: "integer" }}
        value={value}
      />
    );
  };

  return (
    <Box>
      <Box display="flex" flexWrap="wrap" alignItems="center" justify="center">
        {/* @ts-ignore */}
        {dateElementProps().map((elemProps: WidgetProps, i) => {
          const elemId = id + "_" + elemProps.type;
          return (
            <Box key={elemId} mr="2" mb="2">
              {renderDateElement({
                ...elemProps,
                autofocus: autofocus && i === 0,
                disabled,
                id: elemId,
                onBlur,
                onFocus,
                readonly,
                registry,
                select: handleChange,
                value: elemProps.value < 0 ? undefined : elemProps.value,
              })}
            </Box>
          );
        })}
      </Box>
      <Box display="flex">
        {!options.hideNowButton && (
          <Button onClick={handleNow} mr="2">
            Now
          </Button>
        )}
        {!options.hideClearButton && (
          <Button onClick={handleClear}>Clear</Button>
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
