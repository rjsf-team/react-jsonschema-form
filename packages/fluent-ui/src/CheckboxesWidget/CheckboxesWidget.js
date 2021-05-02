import { __assign } from "tslib";
import React from "react";
import { Checkbox, Label } from "@fluentui/react";
import { allowedProps } from "../CheckboxWidget";
import _pick from "lodash/pick";
var styles_red = {
    // TODO: get this color from theme.
    color: "rgb(164, 38, 44)",
    fontSize: 12,
    fontWeight: "normal",
    fontFamily: "\"Segoe UI\", \"Segoe UI Web (West European)\", \"Segoe UI\", -apple-system, BlinkMacSystemFont, Roboto, \"Helvetica Neue\", sans-serif;"
};
var selectValue = function (value, selected, all) {
    var at = all.indexOf(value);
    var updated = selected.slice(0, at).concat(value, selected.slice(at));
    // As inserting values at predefined index positions doesn't work with empty
    // arrays, we need to reorder the updated selection to match the initial order
    return updated.sort(function (a, b) { return all.indexOf(a) > all.indexOf(b); });
};
var deselectValue = function (value, selected) {
    return selected.filter(function (v) { return v !== value; });
};
var CheckboxesWidget = function (_a) {
    var schema = _a.schema, label = _a.label, id = _a.id, disabled = _a.disabled, options = _a.options, value = _a.value, autofocus = _a.autofocus, readonly = _a.readonly, required = _a.required, onChange = _a.onChange, onBlur = _a.onBlur, onFocus = _a.onFocus, _b = _a.rawErrors, rawErrors = _b === void 0 ? [] : _b;
    var enumOptions = options.enumOptions, enumDisabled = options.enumDisabled;
    var _onChange = function (option) { return function (_ev, checked) {
        var all = enumOptions.map(function (_a) {
            var value = _a.value;
            return value;
        });
        if (checked) {
            onChange(selectValue(option.value, value, all));
        }
        else {
            onChange(deselectValue(option.value, value));
        }
    }; };
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
        React.createElement(Label, null,
            label || schema.title,
            required && React.createElement("span", { style: styles_red }, "\u00A0*")),
        enumOptions.map(function (option, index) {
            var checked = value.indexOf(option.value) !== -1;
            var itemDisabled = enumDisabled && enumDisabled.indexOf(option.value) != -1;
            return (React.createElement(Checkbox, __assign({ id: id + "_" + index, checked: checked, label: option.label, disabled: disabled || itemDisabled || readonly, autoFocus: autofocus && index === 0, onChange: _onChange(option), onBlur: _onBlur, onFocus: _onFocus, key: index }, uiProps)));
        }),
        React.createElement("span", { style: styles_red }, (rawErrors || []).join("\n"))));
};
export default CheckboxesWidget;
//# sourceMappingURL=CheckboxesWidget.js.map