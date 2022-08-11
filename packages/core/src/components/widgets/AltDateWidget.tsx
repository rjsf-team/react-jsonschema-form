import React, { Component, MouseEvent } from "react";

import {
  shouldRender,
  parseDateString,
  toDateString,
  pad,
  WidgetProps,
  DateObject,
} from "@rjsf/utils";

function rangeOptions(start: number, stop: number) {
  const options = [];
  for (let i = start; i <= stop; i++) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
}

function readyForChange(state: any) {
  return Object.keys(state).every((key) => state[key] !== -1);
}

function DateElement(props: any) {
  const {
    type,
    range,
    value,
    select,
    rootId,
    disabled,
    readonly,
    autofocus,
    registry,
    onBlur,
  } = props;
  const id = rootId + "_" + type;
  const { SelectWidget } = registry.widgets;
  return (
    <SelectWidget
      schema={{ type: "integer" }}
      id={id}
      className="form-control"
      options={{ enumOptions: rangeOptions(range[0], range[1]) }}
      placeholder={type}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={(value: any) => select(type, value)}
      onBlur={onBlur}
    />
  );
}

/** The `AltDateWidget` is an alternative widget for rendering date properties. */
class AltDateWidget<T = any, F = any> extends Component<
  WidgetProps<T, F>,
  DateObject
> {
  static defaultProps = {
    time: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    options: {
      yearsRange: [1900, new Date().getFullYear() + 2],
    },
  };

  /**
   *
   * @param props - The `WidgetProps` for this component
   */
  constructor(props: WidgetProps<T, F>) {
    super(props);
    this.state = parseDateString(props.value, props.time);
  }

  componentDidUpdate(prevProps: WidgetProps<T, F>) {
    if (
      prevProps.value &&
      prevProps.value !== parseDateString(this.props.value, this.props.time)
    ) {
      this.setState(parseDateString(this.props.value, this.props.time));
    }
  }

  shouldComponentUpdate(
    nextProps: WidgetProps<T, F>,
    nextState: DateObject
  ): boolean {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (property: keyof DateObject, value: any) => {
    this.setState(
      { [property]: typeof value === "undefined" ? -1 : value } as Pick<
        DateObject,
        keyof DateObject
      >,
      () => {
        // Only propagate to parent state if we have a complete date{time}
        if (readyForChange(this.state)) {
          this.props.onChange(toDateString(this.state, this.props.time));
        }
      }
    );
  };

  setNow = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const { time, disabled, readonly, onChange } = this.props;
    if (disabled || readonly) {
      return;
    }
    const nowDateObj = parseDateString(new Date().toJSON(), time);
    this.setState(nowDateObj, () => onChange(toDateString(this.state, time)));
  };

  clear = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const { time, disabled, readonly, onChange } = this.props;
    if (disabled || readonly) {
      return;
    }
    this.setState(parseDateString("", time), () => onChange(undefined));
  };

  get dateElementProps() {
    const { time, options } = this.props;
    const { year, month, day, hour, minute, second } = this.state;
    const data = [
      {
        type: "year",
        range: options.yearsRange,
        value: year,
      },
      { type: "month", range: [1, 12], value: month },
      { type: "day", range: [1, 31], value: day },
    ] as { type: string; range: [number, number]; value: number | undefined }[];
    if (time) {
      data.push(
        { type: "hour", range: [0, 23], value: hour },
        { type: "minute", range: [0, 59], value: minute },
        { type: "second", range: [0, 59], value: second }
      );
    }
    return data;
  }

  render() {
    const { id, disabled, readonly, autofocus, registry, onBlur, options } =
      this.props;
    return (
      <ul className="list-inline">
        {this.dateElementProps.map((elemProps, i) => (
          <li key={i}>
            <DateElement
              rootId={id}
              select={this.onChange}
              {...elemProps}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              autofocus={autofocus && i === 0}
            />
          </li>
        ))}
        {(options.hideNowButton !== "undefined"
          ? !options.hideNowButton
          : true) && (
          <li>
            <a href="#" className="btn btn-info btn-now" onClick={this.setNow}>
              Now
            </a>
          </li>
        )}
        {(options.hideClearButton !== "undefined"
          ? !options.hideClearButton
          : true) && (
          <li>
            <a
              href="#"
              className="btn btn-warning btn-clear"
              onClick={this.clear}
            >
              Clear
            </a>
          </li>
        )}
      </ul>
    );
  }
}

export default AltDateWidget;
