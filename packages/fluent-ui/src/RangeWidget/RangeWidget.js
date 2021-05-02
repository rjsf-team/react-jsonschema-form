import { __assign } from "tslib";
import React from "react";
import { Slider, Label } from "@fluentui/react";
import { utils } from "@rjsf/core";
import _pick from "lodash/pick";
var rangeSpec = utils.rangeSpec;
var styles_red = {
    // TODO: get this color from theme.
    color: "rgb(164, 38, 44)",
    fontSize: 12,
    fontWeight: "normal",
    fontFamily: "\"Segoe UI\", \"Segoe UI Web (West European)\", \"Segoe UI\", -apple-system, BlinkMacSystemFont, Roboto, \"Helvetica Neue\", sans-serif;",
};
// Keys of ISliderProps from @fluentui/react
var allowedProps = [
    "componentRef",
    "styles?",
    "theme",
    "label",
    "defaultValue",
    "value",
    "min",
    "max",
    "step",
    "showValue",
    "onChange",
    "ariaLabel",
    "ariaValueText",
    "vertical",
    "disabled",
    "snapToStep",
    "className",
    "buttonProps",
    "valueFormat",
    "originFromZero",
];
var RangeWidget = function (_a) {
    var value = _a.value, readonly = _a.readonly, disabled = _a.disabled, onBlur = _a.onBlur, onFocus = _a.onFocus, options = _a.options, schema = _a.schema, 
    //formContext,
    //registry,
    //rawErrors,
    onChange = _a.onChange, required = _a.required, label = _a.label, id = _a.id;
    var sliderProps = __assign({ value: value, label: label, id: id }, rangeSpec(schema));
    var _onChange = function (value) { return onChange(value); };
    var uiProps = _pick(options.props || {}, allowedProps);
    return (React.createElement(React.Fragment, null,
        React.createElement(Label, null,
            label || schema.title,
            required && React.createElement("span", { style: styles_red }, "\u00A0*")),
        React.createElement(Slider, __assign({ disabled: disabled || readonly, min: sliderProps.min, max: sliderProps.max, step: sliderProps.step, onChange: _onChange, snapToStep: true }, uiProps))));
};
export default RangeWidget;
//# sourceMappingURL=RangeWidget.js.map