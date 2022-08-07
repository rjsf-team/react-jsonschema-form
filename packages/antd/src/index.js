import { withTheme, getDefaultRegistry } from "@rjsf/core";

import ArrayFieldTemplate from "./templates/ArrayFieldTemplate";
import BaseInputTemplate from "./templates/BaseInputTemplate";
import DescriptionField from "./templates/DescriptionField";
import ErrorList from "./templates/ErrorList";
import FieldTemplate from "./templates/FieldTemplate";
import ObjectFieldTemplate from "./templates/ObjectFieldTemplate";
import TitleField from "./templates/TitleField";

import AltDateTimeWidget from "./widgets/AltDateTimeWidget";
import AltDateWidget from "./widgets/AltDateWidget";
import CheckboxesWidget from "./widgets/CheckboxesWidget";
import CheckboxWidget from "./widgets/CheckboxWidget";
import DateTimeWidget from "./widgets/DateTimeWidget";
import DateWidget from "./widgets/DateWidget";
import PasswordWidget from "./widgets/PasswordWidget";
import RadioWidget from "./widgets/RadioWidget";
import RangeWidget from "./widgets/RangeWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextareaWidget from "./widgets/TextareaWidget";
import SubmitButton from "./widgets/SubmitButton";

// import './index.less';

const { fields, templates, widgets } = getDefaultRegistry();

export const Widgets = {
  AltDateTimeWidget,
  AltDateWidget,
  CheckboxesWidget,
  CheckboxWidget,
  DateTimeWidget,
  DateWidget,
  PasswordWidget,
  RadioWidget,
  RangeWidget,
  SelectWidget,
  TextareaWidget,
  SubmitButton,
};

export const Theme = {
  fields,
  templates: {
    ...templates,
    ArrayFieldTemplate,
    BaseInputTemplate,
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate: TitleField,
  },
  widgets: { ...widgets, ...Widgets },
};

export const Form = withTheme(Theme);

export default Form;
