import React from "react";
import { Label } from "@fluentui/react";
var styles = {
    root: [
        {
            fontSize: 24,
            marginBottom: 20,
            paddingBottom: 0
        },
    ],
};
var TitleField = function (_a) {
    var title = _a.title;
    return (React.createElement(React.Fragment, null,
        React.createElement(Label, { styles: styles }, title)));
};
export default TitleField;
//# sourceMappingURL=TitleField.js.map