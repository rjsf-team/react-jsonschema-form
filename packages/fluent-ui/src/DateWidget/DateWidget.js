import { __assign } from "tslib";
import React from "react";
import { DatePicker, DayOfWeek, mergeStyleSets, } from "@fluentui/react";
import _pick from "lodash/pick";
import { utils } from "@rjsf/core";
var pad = utils.pad;
// Keys of IDropdownProps from @fluentui/react
var allowedProps = [
    "componentRef",
    "styles",
    "theme",
    "calloutProps",
    "calendarProps",
    "textField",
    "calendarAs",
    "onSelectDate",
    "label",
    "isRequired",
    "disabled",
    "ariaLabel",
    "underlined",
    "pickerAriaLabel",
    "isMonthPickerVisible",
    "showMonthPickerAsOverlay",
    "allowTextInput",
    "disableAutoFocus",
    "placeholder",
    "today",
    "value",
    "formatDate",
    "parseDateFromString",
    "firstDayOfWeek",
    "strings",
    "highlightCurrentMonth",
    "highlightSelectedMonth",
    "showWeekNumbers",
    "firstWeekOfYear",
    "showGoToToday",
    "borderless",
    "className",
    "dateTimeFormatter",
    "minDate",
    "maxDate",
    "initialPickerDate",
    "allFocusable",
    "onAfterMenuDismiss",
    "showCloseButton",
    "tabIndex"
];
var controlClass = mergeStyleSets({
    control: {
        margin: "0 0 15px 0",
    },
});
// TODO: move to utils.
// TODO: figure out a standard format for this, as well as
// how we can get this to work with locales.
var formatDate = function (date) {
    if (!date) {
        return "";
    }
    var yyyy = pad(date.getFullYear(), 4);
    var MM = pad(date.getMonth() + 1, 2);
    var dd = pad(date.getDate(), 2);
    return yyyy + "-" + MM + "-" + dd;
};
var parseDate = function (dateStr) {
    if (!dateStr) {
        return undefined;
    }
    var _a = dateStr.split("-").map(function (e) { return parseInt(e); }), year = _a[0], month = _a[1], day = _a[2];
    var dt = new Date(year, month - 1, day);
    return dt;
};
var DateWidget = function (_a) {
    var id = _a.id, required = _a.required, readonly = _a.readonly, disabled = _a.disabled, label = _a.label, value = _a.value, onChange = _a.onChange, onBlur = _a.onBlur, onFocus = _a.onFocus, autofocus = _a.autofocus, options = _a.options, placeholder = _a.placeholder, schema = _a.schema, rawErrors = _a.rawErrors;
    var _onSelectDate = function (date) {
        if (date) {
            var formatted = formatDate(date);
            formatted && onChange(formatted);
        }
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
    return (React.createElement(DatePicker, __assign({ className: controlClass.control, firstDayOfWeek: DayOfWeek.Sunday, placeholder: placeholder, ariaLabel: "Select a date", isRequired: required, label: label, onSelectDate: _onSelectDate, onBlur: _onBlur, onFocus: _onFocus, value: parseDate(value) }, uiProps)));
};
export default DateWidget;
//# sourceMappingURL=DateWidget.js.map