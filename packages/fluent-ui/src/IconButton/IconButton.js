import React from "react";
import { IconButton } from "@fluentui/react";
var mappings = {
    remove: "Delete",
    "arrow-up": "Up",
    "arrow-down": "Down",
};
export default (function (props) { return (React.createElement(IconButton, { disabled: props.disabled, onClick: function (e) { return props.onClick(e); }, iconProps: {
        iconName: mappings[props.icon]
    }, color: "secondary" })); });
//# sourceMappingURL=IconButton.js.map