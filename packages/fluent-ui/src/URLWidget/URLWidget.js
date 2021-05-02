import { __assign } from "tslib";
import React from "react";
import TextWidget from "../TextWidget";
var URLWidget = function (props) {
    var uiProps = props.options["props"] || {};
    var options = __assign(__assign({}, props.options), { props: __assign({ type: "url" }, uiProps) });
    return (React.createElement(TextWidget, __assign({}, props, { options: options, value: props.value, onChange: props.onChange }, uiProps)));
};
export default URLWidget;
//# sourceMappingURL=URLWidget.js.map