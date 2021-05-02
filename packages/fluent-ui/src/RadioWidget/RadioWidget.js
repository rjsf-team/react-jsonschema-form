import { __assign } from "tslib";
import React from "react";
import { ChoiceGroup } from "@fluentui/react";
import _pick from "lodash/pick";
// Keys of IChoiceGroupProps from @fluentui/react
var allowedProps = [
    "componentRef",
    "options",
    "defaultSelectedKey",
    "selectedKey",
    "onChange",
    "label",
    "onChanged",
    "theme",
    "styles",
    "ariaLabelledBy"
];
var RadioWidget = function (_a) {
    var id = _a.id, schema = _a.schema, options = _a.options, value = _a.value, required = _a.required, disabled = _a.disabled, readonly = _a.readonly, label = _a.label, onChange = _a.onChange, onBlur = _a.onBlur, onFocus = _a.onFocus;
    var enumOptions = options.enumOptions, enumDisabled = options.enumDisabled;
    function _onChange(ev, option) {
        if (option) {
            onChange(option.key);
        }
    }
    var _onBlur = function (_a) {
        var value = _a.target.value;
        return onBlur(id, value);
    };
    var _onFocus = function (_a) {
        var value = _a.target.value;
        return onFocus(id, value);
    };
    var row = options ? options.inline : false;
    var newOptions = enumOptions.map(function (option) { return ({
        key: option.value,
        text: option.label,
        disabled: (enumDisabled || []).indexOf(option.value) !== -1
    }); });
    var uiProps = _pick(options.props || {}, allowedProps);
    return (React.createElement(ChoiceGroup, __assign({ options: newOptions, onChange: _onChange, onFocus: _onFocus, onBlur: _onBlur, label: label || schema.title, required: required, selectedKey: value }, uiProps)));
};
export default RadioWidget;
//# sourceMappingURL=RadioWidget.js.map