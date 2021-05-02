import React from "react";
import { Text } from "@fluentui/react";
import { List } from "@fluentui/react";
var styles = {
    root: [
        {
            fontSize: 24,
        },
    ],
};
var FieldTemplate = function (_a) {
    var id = _a.id, children = _a.children, displayLabel = _a.displayLabel, _b = _a.rawErrors, rawErrors = _b === void 0 ? [] : _b, rawHelp = _a.rawHelp, rawDescription = _a.rawDescription, classNames = _a.classNames, label = _a.label, required = _a.required;
    // TODO: do this better by not returning the form-group class from master.
    classNames = "ms-Grid-col ms-sm12 " + classNames.replace("form-group", "");
    return (React.createElement("div", { className: classNames, style: { marginBottom: 15 } },
        children,
        rawDescription && React.createElement(Text, null, rawDescription),
        rawErrors.length > 0 && React.createElement(List, { items: rawErrors }),
        rawHelp && React.createElement(Text, { id: id }, rawHelp)));
};
export default FieldTemplate;
//# sourceMappingURL=FieldTemplate.js.map