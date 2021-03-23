import React, { useEffect, useState } from "react";

import { utils } from '@rjsf/core';
import Button from 'antd/lib/button';
import Col from 'antd/lib/col';
import Row from 'antd/lib/row';

const { pad, parseDateString, toDateString } = utils;

const rangeOptions = (start, stop) => {
  let options = [];
  for (let i = start; i <= stop; i++) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
};

const readyForChange = (state) => {
  return Object.keys(state).every(
    key => typeof state[key] !== "undefined" && state[key] !== -1,
  );
};

const AltDateWidget = ({
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
}) => {
  const { SelectWidget } = registry.widgets;
  const { rowGutter = 24 } = formContext;

  const [state, setState] = useState(parseDateString(value, showTime));

  useEffect(() => {
    setState(parseDateString(value, showTime));
  }, [showTime, value]);

  const handleChange = (property, nextValue) => {
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

  const handleNow = (event) => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    const nextState = parseDateString(new Date().toJSON(), showTime);
    onChange(toDateString(nextState, showTime));
  };

  const handleClear = (event) => {
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

  const renderDateElement = (elemProps) => (
    <SelectWidget
      autofocus={elemProps.autofocus}
      className="form-control"
      disabled={elemProps.disabled}
      id={elemProps.id}
      onBlur={elemProps.onBlur}
      onChange={(elemValue) => elemProps.select(elemProps.type, elemValue)}
      onFocus={elemProps.onFocus}
      options={{
        enumOptions: rangeOptions(elemProps.range[0], elemProps.range[1]),
      }}
      placeholder={elemProps.type}
      readonly={elemProps.readonly}
      schema={{ type: "integer" }}
      value={elemProps.value}
    />
  );

  return (
    <Row gutter={[Math.floor(rowGutter / 2), Math.floor(rowGutter / 2)]}>
      {dateElementProps().map((elemProps, i) => {
        const elemId = id + "_" + elemProps.type;
        return (
          <Col flex="88px" key={elemId}>
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
              // NOTE: antd components accept -1 rather than issue a warning
              // like material-ui, so we need to convert -1 to undefined here.
              value: elemProps.value < 0 ? undefined : elemProps.value,
            })}
          </Col>
        );
      })}
      {!options.hideNowButton && (
        <Col flex="88px">
          <Button block className="btn-now" onClick={handleNow} type="primary">
            Now
          </Button>
        </Col>
      )}
      {!options.hideClearButton && (
        <Col flex="88px">
          <Button
            block
            className="btn-clear"
            danger
            onClick={handleClear}
            type="primary"
          >
            Clear
          </Button>
        </Col>
      )}
    </Row>
  );
};

AltDateWidget.defaultProps = {
  autofocus: false,
  disabled: false,
  options: {
    yearsRange: [1900, new Date().getFullYear() + 2],
  },
  readonly: false,
  showTime: false,
};

export default AltDateWidget;
