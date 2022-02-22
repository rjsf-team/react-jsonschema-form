import React from 'react';
import { utils } from '@rjsf/core';
import { Form as SuiForm } from "semantic-ui-react";
import SubmitButton from '../SubmitButton';
import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";
const { getDefaultRegistry }  = utils;
const { fields, widgets } = getDefaultRegistry();

const Theme = {
  ArrayFieldTemplate,
  ErrorList,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  _internalFormWrapper: SuiForm,
  widgets: { ...widgets, ...Widgets },
  children: React.createElement(SubmitButton)
};

export default Theme;
