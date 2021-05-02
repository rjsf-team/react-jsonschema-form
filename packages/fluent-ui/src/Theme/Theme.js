import { __assign } from "tslib";
import React from 'react';
import ArrayFieldTemplate from '../ArrayFieldTemplate';
import ErrorList from '../ErrorList';
import Fields from '../Fields';
import FieldTemplate from '../FieldTemplate';
import ObjectFieldTemplate from '../ObjectFieldTemplate';
import SubmitButton from '../SubmitButton';
import Widgets from '../Widgets';
import { utils } from '@rjsf/core';
var getDefaultRegistry = utils.getDefaultRegistry;
var _a = getDefaultRegistry(), fields = _a.fields, widgets = _a.widgets;
var Theme = {
    ArrayFieldTemplate: ArrayFieldTemplate,
    fields: __assign(__assign({}, fields), Fields),
    FieldTemplate: FieldTemplate,
    ObjectFieldTemplate: ObjectFieldTemplate,
    widgets: __assign(__assign({}, widgets), Widgets),
    ErrorList: ErrorList,
    children: React.createElement(SubmitButton)
};
export default Theme;
//# sourceMappingURL=Theme.js.map