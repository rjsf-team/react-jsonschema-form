import { __assign, __spreadArrays } from "tslib";
import React from "react";
import { Label, Dropdown } from "@fluentui/react";
import _pick from "lodash/pick";
// Keys of IDropdownProps from @fluentui/react
var allowedProps = [
    "placeHolder",
    "options",
    "onChange",
    "onChanged",
    "onRenderLabel",
    "onRenderPlaceholder",
    "onRenderPlaceHolder",
    "onRenderTitle",
    "onRenderCaretDown",
    "dropdownWidth",
    "responsiveMode",
    "defaultSelectedKeys",
    "selectedKeys",
    "multiselectDelimiter",
    "notifyOnReselect",
    "isDisabled",
    "keytipProps",
    "theme",
    "styles",
    // ISelectableDroppableTextProps
    "componentRef",
    "label",
    "ariaLabel",
    "id",
    "className",
    "defaultSelectedKey",
    "selectedKey",
    "multiSelect",
    "options",
    "onRenderContainer",
    "onRenderList",
    "onRenderItem",
    "onRenderOption",
    "onDismiss",
    "disabled",
    "required",
    "calloutProps",
    "panelProps",
    "errorMessage",
    "placeholder",
    "openOnKeyboardFocus"
];
var SelectWidget = function (_a) {
    var schema = _a.schema, id = _a.id, options = _a.options, label = _a.label, required = _a.required, disabled = _a.disabled, readonly = _a.readonly, value = _a.value, multiple = _a.multiple, autofocus = _a.autofocus, onChange = _a.onChange, onBlur = _a.onBlur, onFocus = _a.onFocus;
    var enumOptions = options.enumOptions, enumDisabled = options.enumDisabled;
    var _onChange = function (_ev, item) {
        if (!item) {
            return;
        }
        if (multiple) {
            var valueOrDefault = value || [];
            if (item.selected) {
                onChange(__spreadArrays(valueOrDefault, [item.key]));
            }
            else {
                onChange(valueOrDefault.filter(function (key) { return key !== item.key; }));
            }
        }
        else {
            onChange(item.key);
        }
    };
    var _onBlur = function (e) { return onBlur(id, e.target.value); };
    var _onFocus = function (e) { return onFocus(id, e.target.value); };
    var newOptions = enumOptions.map(function (option) { return ({
        key: option.value,
        text: option.label,
        disabled: (enumDisabled || []).indexOf(option.value) !== -1
    }); });
    var uiProps = _pick(options.props || {}, allowedProps);
    return (React.createElement(React.Fragment, null,
        React.createElement(Label, null, label || schema.title),
        React.createElement(Dropdown, __assign({ multiSelect: multiple, defaultSelectedKey: value, required: required, options: newOptions, disabled: disabled || readonly, onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus }, uiProps))));
};
export default SelectWidget;
//# sourceMappingURL=SelectWidget.js.map