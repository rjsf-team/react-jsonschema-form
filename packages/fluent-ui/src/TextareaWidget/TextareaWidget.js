import { __assign } from "tslib";
import React from "react";
import TextWidget from '../TextWidget';
var TextareaWidget = function (props) {
    var uiProps = props.options["props"] || {};
    var options = __assign(__assign({}, props.options), { "props": __assign({ multiline: true }, uiProps) });
    // TODO: rows and columns.
    return (React.createElement(TextWidget, __assign({}, props, { options: options })));
};
export default TextareaWidget;
//# sourceMappingURL=TextareaWidget.js.map