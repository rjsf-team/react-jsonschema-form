import { __assign } from "tslib";
import React from "react";
import { Checkbox } from "@fluentui/react";
import _pick from "lodash/pick";
// Keys of ICheckboxProps from @fluentui/react
export var allowedProps = [
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
    "theme"
];
var CheckboxWidget = function (props) {
    var id = props.id, value = props.value, 
    // required,
    disabled = props.disabled, readonly = props.readonly, label = props.label, schema = props.schema, autofocus = props.autofocus, onChange = props.onChange, onBlur = props.onBlur, onFocus = props.onFocus, options = props.options;
    var _onChange = React.useCallback(function (_a, checked) {
        onChange(checked);
    }, []);
    var _onBlur = function (_a) {
        var value = _a.target.value;
        return onBlur(id, value);
    };
    var _onFocus = function (_a) {
        var value = _a.target.value;
        return onFocus(id, value);
    };
    var uiProps = _pick(options.props || {}, allowedProps);
    return (React.createElement(React.Fragment, null,
        React.createElement(Checkbox, __assign({ id: id, label: label || schema.title, disabled: disabled || readonly, autoFocus: autofocus, onBlur: _onBlur, onFocus: _onFocus, checked: typeof value === "undefined" ? false : value, onChange: _onChange }, uiProps))));
};
export default CheckboxWidget;
//# sourceMappingURL=CheckboxWidget.js.map