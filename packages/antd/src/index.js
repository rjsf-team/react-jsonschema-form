import { utils, withTheme } from '@rjsf/core';

import DescriptionField from './fields/DescriptionField';
import TitleField from './fields/TitleField';

import FieldTemplate from './templates/FieldTemplate';
import ObjectFieldTemplate from './templates/ObjectFieldTemplate';
import ArrayFieldTemplate from './templates/ArrayFieldTemplate';

import AltDateTimeWidget from './widgets/AltDateTimeWidget';
import AltDateWidget from './widgets/AltDateWidget';
import CheckboxesWidget from './widgets/CheckboxesWidget';
import CheckboxWidget from './widgets/CheckboxWidget';
import ColorWidget from './widgets/ColorWidget';
import DateTimeWidget from './widgets/DateTimeWidget';
import DateWidget from './widgets/DateWidget';
import EmailWidget from './widgets/EmailWidget';
import PasswordWidget from './widgets/PasswordWidget';
import RadioWidget from './widgets/RadioWidget';
import RangeWidget from './widgets/RangeWidget';
import SelectWidget from './widgets/SelectWidget';
import TextareaWidget from './widgets/TextareaWidget';
import TextWidget from './widgets/TextWidget';
import UpDownWidget from './widgets/UpDownWidget';
import URLWidget from './widgets/URLWidget';
import SubmitButton from './widgets/SubmitButton';

import ErrorList from './ErrorList';

// import './index.less';

const { getDefaultRegistry } = utils;
const { fields, widgets } = getDefaultRegistry();

export const Fields = {
  DescriptionField,
  TitleField,
};

export const Widgets = {
  AltDateTimeWidget,
  AltDateWidget,
  CheckboxesWidget,
  CheckboxWidget,
  ColorWidget,
  DateTimeWidget,
  DateWidget,
  EmailWidget,
  PasswordWidget,
  RadioWidget,
  RangeWidget,
  SelectWidget,
  TextareaWidget,
  TextWidget,
  UpDownWidget,
  URLWidget,
  SubmitButton,
};

export const Theme = {
  ArrayFieldTemplate,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  widgets: { ...widgets, ...Widgets },
  ErrorList,
};

export const Form = withTheme(Theme);

export default Form;
