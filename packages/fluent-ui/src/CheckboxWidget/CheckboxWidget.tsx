import React from "react";
import { Checkbox } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";

const CheckboxWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    // required,
    disabled,
    readonly,
    label,
    autofocus,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const _onChange = React.useCallback(({}, checked?: boolean): void => {
    onChange(checked);
  }, []);

  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onFocus(id, value);

  return (
    <>
      <div className="col-sm-6">
        <Checkbox
          id={id}
          label={label}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onBlur={_onBlur}
          onFocus={_onFocus}
          checked={typeof value === "undefined" ? false : value}
          onChange={_onChange}
        />
      </div>
    </>
  );
};

export default CheckboxWidget;
