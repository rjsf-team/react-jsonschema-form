import { __assign } from "tslib";
import React from "react";
import { Label } from "@fluentui/react";
import { SpinButton } from "@fluentui/react";
import _pick from "lodash/pick";
import { utils } from "@rjsf/core";
var rangeSpec = utils.rangeSpec;
// Keys of ISpinButtonProps from @fluentui/react
var allowedProps = [
    "ariaDescribedBy",
    "ariaLabel",
    "ariaPositionInSet",
    "ariaSetSize",
    "ariaValueNow",
    "ariaValueText",
    "className",
    "componentRef",
    "decrementButtonAriaLabel",
    "decrementButtonIcon",
    "defaultValue",
    "disabled",
    "downArrowButtonStyles",
    "getClassNames",
    "iconButtonProps",
    "iconProps",
    "incrementButtonAriaLabel",
    "incrementButtonIcon",
    "inputProps",
    "keytipProps",
    "label",
    "labelPosition",
    "max",
    "min",
    "onBlur",
    "onDecrement",
    "onFocus",
    "onIncrement",
    "onValidate",
    "precision",
    "step",
    "styles",
    "theme",
    "title",
    "upArrowButtonStyles",
    "value",
];
var UpDownWidget = function (_a) {
    var id = _a.id, required = _a.required, readonly = _a.readonly, disabled = _a.disabled, label = _a.label, value = _a.value, onChange = _a.onChange, onBlur = _a.onBlur, onFocus = _a.onFocus, options = _a.options, schema = _a.schema;
    var _onChange = function (_a) {
        var value = _a.target.value;
        return onChange(Number(value));
    };
    var _b = rangeSpec(schema), min = _b.min, max = _b.max, step = _b.step;
    if (min === undefined) {
        min = -1 * Infinity;
    }
    if (max === undefined) {
        max = Infinity;
    }
    if (step === undefined) {
        step = 1;
    }
    var _onIncrement = function (value) {
        if (Number(value) + step <= max)
            onChange(Number(value) + step);
    };
    var _onDecrement = function (value) {
        if (Number(value) - step >= min)
            onChange(Number(value) - step);
    };
    var _onBlur = function (_a) {
        var value = _a.target.value;
        return onBlur(id, value);
    };
    var _onFocus = function (_a) {
        var value = _a.target.value;
        return onFocus(id, value);
    };
    var requiredSymbol = required ? "*" : "";
    var uiProps = _pick(options.props || {}, allowedProps);
    return (React.createElement(React.Fragment, null,
        React.createElement(Label, { htmlFor: id }, label + requiredSymbol),
        React.createElement(SpinButton, __assign({ id: id, min: min, max: max, step: step, incrementButtonAriaLabel: "Increase value by 1", decrementButtonAriaLabel: "Decrease value by 1", disabled: disabled || readonly, value: value || value === 0 ? value : "", onBlur: _onBlur, onFocus: _onFocus, onChange: _onChange, onIncrement: _onIncrement, onDecrement: _onDecrement, for: "" }, uiProps))));
};
export default UpDownWidget;
//# sourceMappingURL=UpDownWidget.js.map