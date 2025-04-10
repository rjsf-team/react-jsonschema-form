import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
// This plugin is needed to support the parsing of date and time values in the `DateWidget` and `DateTimeWidget`
dayjs.extend(customParseFormat);

import { AltDateTimeWidget, AltDateWidget, DateWidget, DateTimeWidget, TimeWidget } from './DateTime';
import CheckboxesWidget from './CheckboxesWidget';
import CheckboxWidget from './CheckboxWidget';
import ColorWidget from './ColorWidget';
import FileWidget from './FileWidget';
import PasswordWidget from './PasswordWidget';
import RadioWidget from './RadioWidget';
import RangeWidget from './RangeWidget';
import SelectWidget from './SelectWidget';
import TextareaWidget from './TextareaWidget';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryWidgetsType<T, S, F> {
  return {
    AltDateTimeWidget,
    AltDateWidget,
    CheckboxesWidget,
    CheckboxWidget,
    ColorWidget,
    FileWidget,
    DateTimeWidget,
    DateWidget,
    PasswordWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
    TimeWidget,
  };
}

export default generateWidgets();
