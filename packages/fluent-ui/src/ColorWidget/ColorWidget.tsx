import React from "react";
import {
  ColorPicker,
  IColorPickerProps,
  IColor,
  getColorFromString,
  Label,
} from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";
import _pick from "lodash/pick";

const styles_red = {
  // TODO: get this color from theme.
  color: "rgb(164, 38, 44)",
  fontSize: 12,
  fontWeight: "normal" as any,
  fontFamily: `"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;`,
};

const allowedProps: (keyof IColorPickerProps)[] = [
  "componentRef",
  "color",
  "strings",
  "onChange",
  "alphaType",
  "alphaSliderHidden",
  "hexLabel",
  "redLabel",
  "greenLabel",
  "blueLabel",
  "alphaLabel",
  "className",
  "theme",
  "styles",
  "showPreview",
];

const ColorWidget = ({
  schema,
  options,
  value,
  required,
  label,
  onChange,
}: WidgetProps) => {
  const updateColor = (_ev: any, colorObj: IColor) => {
    onChange(colorObj.hex);
  };

  const uiProps = _pick(options.props || {}, allowedProps);

  return (
    <>
      <Label>
        {label || schema.title}
        {required && <span style={styles_red}>&nbsp;*</span>}
      </Label>
      <ColorPicker
        color={getColorFromString(value) as any}
        onChange={updateColor}
        alphaType={"alpha"}
        showPreview={true}
        {...uiProps}
      />
    </>
  );
};
export default ColorWidget;
