import { utils } from '@rjsf/core';

import ArrayFieldTemplate from '../ArrayFieldTemplate';
import ErrorList from '../ErrorList';
import Fields from '../Fields';
import FieldTemplate from '../FieldTemplate';
import ObjectFieldTemplate from '../ObjectFieldTemplate';
import Widgets from '../Widgets';

const { getDefaultRegistry } = utils;

const { fields, widgets } = getDefaultRegistry();

const ThemeCommon = {
  ArrayFieldTemplate,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  widgets: { ...widgets, ...Widgets },
  ErrorList,
};

export default ThemeCommon;
