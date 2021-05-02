import { __assign } from "tslib";
import React from "react";
import { utils } from "@rjsf/core";
import TextWidget from "../TextWidget";
var localToUTC = utils.localToUTC, utcToLocal = utils.utcToLocal;
var DateTimeWidget = function (props) {
    var uiProps = props.options["props"] || {};
    var value = utcToLocal(props.value);
    var onChange = function (value) {
        props.onChange(localToUTC(value));
    };
    var options = __assign(__assign({}, props.options), { props: __assign({ type: "datetime-local" }, uiProps) });
    // TODO: rows and columns.
    return React.createElement(TextWidget, __assign({}, props, { options: options, value: value, onChange: onChange }));
};
export default DateTimeWidget;
//# sourceMappingURL=DateTimeWidget.js.map