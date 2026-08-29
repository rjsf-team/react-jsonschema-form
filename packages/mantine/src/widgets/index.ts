import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxesWidget from './CheckboxesWidget.js';
import CheckboxWidget from './CheckboxWidget.js';
import ColorWidget from './ColorWidget.js';
import { AltDateTimeWidget, AltDateWidget, DateWidget, DateTimeWidget, TimeWidget } from './DateTime/index.js';
import FileWidget from './FileWidget.js';
import PasswordWidget from './PasswordWidget.js';
import RadioWidget from './RadioWidget.js';
import RangeWidget from './RangeWidget.js';
import SelectWidget from './SelectWidget.js';
import TextareaWidget from './TextareaWidget.js';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
