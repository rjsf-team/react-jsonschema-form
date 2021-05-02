import { __assign } from "tslib";
import React from "react";
import { utils } from "@rjsf/core";
import AddButton from "../AddButton/AddButton";
import IconButton from "../IconButton/IconButton";
var rightJustify = {
    float: "right"
};
var isMultiSelect = utils.isMultiSelect, getDefaultRegistry = utils.getDefaultRegistry;
var ArrayFieldTemplate = function (props) {
    var schema = props.schema, _a = props.registry, registry = _a === void 0 ? getDefaultRegistry() : _a;
    // TODO: update types so we don't have to cast registry as any
    if (isMultiSelect(schema, registry.rootSchema)) {
        return React.createElement(DefaultFixedArrayFieldTemplate, __assign({}, props));
    }
    else {
        return React.createElement(DefaultNormalArrayFieldTemplate, __assign({}, props));
    }
};
var ArrayFieldTitle = function (_a) {
    var TitleField = _a.TitleField, idSchema = _a.idSchema, title = _a.title, required = _a.required;
    if (!title) {
        return null;
    }
    var id = idSchema.$id + "__title";
    return React.createElement(TitleField, { id: id, title: title, required: required });
};
var ArrayFieldDescription = function (_a) {
    var DescriptionField = _a.DescriptionField, idSchema = _a.idSchema, description = _a.description;
    if (!description) {
        return null;
    }
    var id = idSchema.$id + "__description";
    return React.createElement(DescriptionField, { id: id, description: description });
};
// Used in the two templates
var DefaultArrayItem = function (props) {
    return (React.createElement("div", { key: props.key, className: "ms-Grid", dir: "ltr" },
        React.createElement("div", { className: "ms-Grid-row" },
            React.createElement("div", { className: "ms-Grid-col ms-sm6 ms-md8 ms-lg9" },
                React.createElement("div", { className: "ms-Grid-row" }, props.children)),
            React.createElement("div", { className: "ms-Grid-col ms-sm6 ms-md4 ms-lg3", style: { textAlign: "right" } },
                React.createElement(IconButton, { icon: "arrow-up", className: "array-item-move-up", disabled: props.disabled || props.readonly || !props.hasMoveUp, onClick: props.onReorderClick(props.index, props.index - 1) }),
                React.createElement(IconButton, { icon: "arrow-down", className: "array-item-move-down", disabled: props.disabled || props.readonly || !props.hasMoveDown, onClick: props.onReorderClick(props.index, props.index + 1) }),
                React.createElement(IconButton, { icon: "remove", className: "array-item-remove", disabled: props.disabled || props.readonly, onClick: props.onDropIndexClick(props.index) })))));
};
var DefaultFixedArrayFieldTemplate = function (props) {
    return (React.createElement("fieldset", { className: props.className },
        React.createElement(ArrayFieldTitle, { key: "array-field-title-" + props.idSchema.$id, TitleField: props.TitleField, idSchema: props.idSchema, title: props.uiSchema["ui:title"] || props.title, required: props.required }),
        (props.uiSchema["ui:description"] || props.schema.description) && (React.createElement("div", { className: "field-description", key: "field-description-" + props.idSchema.$id }, props.uiSchema["ui:description"] || props.schema.description)),
        React.createElement("div", { className: "row array-item-list", key: "array-item-list-" + props.idSchema.$id }, props.items && props.items.map(DefaultArrayItem)),
        props.canAdd && (React.createElement("span", { style: rightJustify },
            React.createElement(AddButton, { className: "array-item-add", onClick: props.onAddClick, disabled: props.disabled || props.readonly, addButtonText: props.uiSchema['ui:addButtonText'] })))));
};
var DefaultNormalArrayFieldTemplate = function (props) {
    return (React.createElement(React.Fragment, null,
        React.createElement(ArrayFieldTitle, { key: "array-field-title-" + props.idSchema.$id, TitleField: props.TitleField, idSchema: props.idSchema, title: props.uiSchema["ui:title"] || props.title, required: props.required }),
        (props.uiSchema["ui:description"] || props.schema.description) && (React.createElement(ArrayFieldDescription, { key: "array-field-description-" + props.idSchema.$id, DescriptionField: props.DescriptionField, idSchema: props.idSchema, description: props.uiSchema["ui:description"] || props.schema.description })),
        props.items && props.items.map(function (p) { return DefaultArrayItem(p); }),
        props.canAdd && (React.createElement("span", { style: rightJustify },
            React.createElement(AddButton, { className: "array-item-add", onClick: props.onAddClick, disabled: props.disabled || props.readonly, addButtonText: props.uiSchema['ui:addButtonText'] })))));
};
export default ArrayFieldTemplate;
//# sourceMappingURL=ArrayFieldTemplate.js.map