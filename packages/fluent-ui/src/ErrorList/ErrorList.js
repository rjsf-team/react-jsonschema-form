import React from "react";
import { MessageBar, MessageBarType } from "@fluentui/react";
var styles = {
    root: [
        {
            fontSize: 24,
        },
    ],
};
var ErrorList = function (_a) {
    var errors = _a.errors;
    return (React.createElement(React.Fragment, null, errors.map(function (error, i) {
        return (React.createElement(MessageBar, { key: i, messageBarType: MessageBarType.error, isMultiline: false, dismissButtonAriaLabel: "Close" }, error.stack));
    })));
};
export default ErrorList;
//# sourceMappingURL=ErrorList.js.map