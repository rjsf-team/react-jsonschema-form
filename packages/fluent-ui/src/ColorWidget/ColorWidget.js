import { __assign } from "tslib";
import React from "react";
import { ColorPicker, getColorFromString, Label, } from "@fluentui/react";
import _pick from "lodash/pick";
var styles_red = {
    // TODO: get this color from theme.
    color: "rgb(164, 38, 44)",
    fontSize: 12,
    fontWeight: "normal",
    fontFamily: "\"Segoe UI\", \"Segoe UI Web (West European)\", \"Segoe UI\", -apple-system, BlinkMacSystemFont, Roboto, \"Helvetica Neue\", sans-serif;",
};
// Keys of IColorPickerProps from @fluentui/react
var allowedProps = [
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
var ColorWidget = function (_a) {
    var id = _a.id, schema = _a.schema, options = _a.options, value = _a.value, required = _a.required, disabled = _a.disabled, readonly = _a.readonly, label = _a.label, onChange = _a.onChange, onBlur = _a.onBlur, onFocus = _a.onFocus;
    var enumOptions = options.enumOptions, enumDisabled = options.enumDisabled;
    var updateColor = function (ev, colorObj) {
        onChange(colorObj.hex);
    };
    var uiProps = _pick(options.props || {}, allowedProps);
    return (React.createElement(React.Fragment, null,
        React.createElement(Label, null,
            label || schema.title,
            required && React.createElement("span", { style: styles_red }, "\u00A0*")),
        React.createElement(ColorPicker, __assign({ color: getColorFromString(value), onChange: updateColor, alphaType: "alpha", showPreview: true }, uiProps))));
};
export default ColorWidget;
//# sourceMappingURL=ColorWidget.js.map