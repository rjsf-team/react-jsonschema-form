// import { withTheme } from 'react-jsonschema-form';
import { getDefaultRegistry } from 'react-jsonschema-form/lib/utils';

import DescriptionField from './fields/DescriptionField';
import TitleField from './fields/TitleField';

import FieldTemplate from './templates/FieldTemplate';
import ObjectFieldTemplate from './templates/ObjectFieldTemplate';
import ArrayFieldTemplate from './templates/ArrayFieldTemplate';

import CheckboxesWidget from './widgets/CheckboxesWidget';
import CheckboxWidget from './widgets/CheckboxWidget';
import ColorWidget from './widgets/ColorWidget';
import DateTimeWidget from './widgets/DateTimeWidget';
import DateWidget from './widgets/DateWidget';
import PasswordWidget from './widgets/PasswordWidget';
import RadioWidget from './widgets/RadioWidget';
import RangeWidget from './widgets/RangeWidget';
import SelectWidget from './widgets/SelectWidget';
import TextareaWidget from './widgets/TextareaWidget';
import TextWidget from './widgets/TextWidget';
import UpDownWidget from './widgets/UpDownWidget';

import ErrorList from './ErrorList';
import withTheme from './withTheme';

import './index.less';

const { fields, widgets } = getDefaultRegistry();

export const Fields = {
  DescriptionField,
  TitleField,
};

export const Widgets = {
  CheckboxesWidget,
  CheckboxWidget,
  ColorWidget,
  DateTimeWidget,
  DateWidget,
  PasswordWidget,
  RadioWidget,
  RangeWidget,
  SelectWidget,
  TextareaWidget,
  TextWidget,
  UpDownWidget,
};

export const Theme = {
  ArrayFieldTemplate,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  widgets: { ...widgets, ...Widgets },
  ErrorList,
};

const Form = withTheme(Theme);
export default Form;
