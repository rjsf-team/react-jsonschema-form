import React from "react";
var ObjectFieldTemplate = function (_a) {
    var DescriptionField = _a.DescriptionField, description = _a.description, TitleField = _a.TitleField, title = _a.title, properties = _a.properties, required = _a.required, uiSchema = _a.uiSchema, idSchema = _a.idSchema;
    return (React.createElement(React.Fragment, null,
        (uiSchema["ui:title"] || title) && (React.createElement(TitleField, { id: idSchema.$id + "-title", title: title, required: required })),
        description && (React.createElement(DescriptionField, { id: idSchema.$id + "-description", description: description })),
        React.createElement("div", { className: "ms-Grid", dir: "ltr" },
            React.createElement("div", { className: "ms-Grid-row" }, properties.map(function (element) { return element.content; })))));
};
export default ObjectFieldTemplate;
//# sourceMappingURL=ObjectFieldTemplate.js.map