import React from "react";
import { CommandBarButton } from "@fluentui/react";
var addIcon = { iconName: "Add" };
var AddButton = function (props) { return (React.createElement(CommandBarButton, { style: { height: "32px" }, iconProps: addIcon, text: props.addButtonText || "Add item", className: props.className, onClick: function (e) { return props.onClick(e); }, disabled: props.disabled })); };
export default AddButton;
//# sourceMappingURL=AddButton.js.map