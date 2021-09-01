import { utils } from '@visma/rjsf-core';
import React from 'react';
import { Form as SuiForm } from "semantic-ui-react";
import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import SubmitButton from '../SubmitButton';
import Widgets from "../Widgets";
const { getDefaultRegistry }  = utils;
const { fields, widgets } = getDefaultRegistry();

const Theme = {
  ArrayFieldTemplate,
  ErrorList,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  tagName: SuiForm,
  widgets: { ...widgets, ...Widgets },
  children: React.createElement(SubmitButton)
};

export default Theme;
