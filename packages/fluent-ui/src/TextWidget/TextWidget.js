import { __assign } from "tslib";
import React from "react";
import { TextField } from "@fluentui/react";
import _pick from "lodash/pick";
// Keys of ITextFieldProps from @fluentui/react
var allowedProps = [
    "multiline",
    "resizable",
    "autoAdjustHeight",
    "underlined",
    "borderless",
    "label",
    "onRenderLabel",
    "description",
    "onRenderDescription",
    "prefix",
    "suffix",
    "onRenderPrefix",
    "onRenderSuffix",
    "iconProps",
    "defaultValue",
    "value",
    "disabled",
    "readOnly",
    "errorMessage",
    "onChange",
    "onNotifyValidationResult",
    "onGetErrorMessage",
    "deferredValidationTime",
    "className",
    "inputClassName",
    "ariaLabel",
    "validateOnFocusIn",
    "validateOnFocusOut",
    "validateOnLoad",
    "theme",
    "styles",
    "autoComplete",
    "mask",
    "maskChar",
    "maskFormat",
    "type",
];
var TextWidget = function (_a) {
    var id = _a.id, placeholder = _a.placeholder, required = _a.required, readonly = _a.readonly, disabled = _a.disabled, label = _a.label, value = _a.value, onChange = _a.onChange, onBlur = _a.onBlur, onFocus = _a.onFocus, autofocus = _a.autofocus, options = _a.options, schema = _a.schema, rawErrors = _a.rawErrors;
    var _onChange = function (_a) {
        var value = _a.target.value;
        return onChange(value === "" ? options.emptyValue : value);
    };
    var _onBlur = function (_a) {
        var value = _a.target.value;
        return onBlur(id, value);
    };
    var _onFocus = function (_a) {
        var value = _a.target.value;
        return onFocus(id, value);
    };
    var uiProps = _pick(options.props || {}, allowedProps);
    var inputType = schema.type === 'string' ? 'text' : "" + schema.type;
    return (React.createElement(TextField, __assign({ id: id, placeholder: placeholder, label: label || schema.title, autoFocus: autofocus, required: required, disabled: disabled, readOnly: readonly, 
        // TODO: once fluent-ui supports the name prop, we can add it back in here.
        // name={name}
        type: inputType, value: value ? value : "", onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus, errorMessage: (rawErrors || []).join("\n") }, uiProps)));
};
export default TextWidget;
//# sourceMappingURL=TextWidget.js.map