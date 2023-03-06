import { Checkbox } from "@fluentui/react";
import {
  ariaDescribedByIds,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import _pick from "lodash/pick";

// Keys of ICheckboxProps from @fluentui/react
export const allowedProps = [
  "ariaDescribedBy",
  "ariaLabel",
  "ariaPositionInSet",
  "ariaSetSize",
  "boxSide",
  "checked",
  "checkmarkIconProps",
  "className",
  "componentRef",
  "defaultChecked",
  "defaultIndeterminate",
  "disabled",
  "indeterminate",
  "inputProps",
  "keytipProps",
  "label",
  "onChange",
  "onRenderLabel",
  "styles",
  "theme",
];

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    // required,
    disabled,
    readonly,
    label,
    schema,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
  } = props;

  const _onChange = React.useCallback(
    (_, checked?: boolean): void => {
      onChange(checked);
    },
    [onChange]
  );

  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onFocus(id, value);

  const uiProps = _pick((options.props as object) || {}, allowedProps);

  return (
    <>
      <Checkbox
        id={id}
        name={id}
        label={label || schema.title}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onBlur={_onBlur}
        onFocus={_onFocus}
        checked={typeof value === "undefined" ? false : value}
        onChange={_onChange}
        {...uiProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
