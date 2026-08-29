import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget.js';
import AltDateWidget from './AltDateWidget.js';
import CheckboxesWidget from './CheckboxesWidget.js';
import CheckboxWidget from './CheckboxWidget.js';
import ColorWidget from './ColorWidget.js';
import DateTimeWidget from './DateTimeWidget.js';
import DateWidget from './DateWidget.js';
import EmailWidget from './EmailWidget.js';
import FileWidget from './FileWidget.js';
import HiddenWidget from './HiddenWidget.js';
import PasswordWidget from './PasswordWidget.js';
import RadioWidget from './RadioWidget.js';
import RangeWidget from './RangeWidget.js';
import RatingWidget from './RatingWidget.js';
import SelectWidget from './SelectWidget.js';
import TextareaWidget from './TextareaWidget.js';
import TextWidget from './TextWidget.js';
import TimeWidget from './TimeWidget.js';
import UpDownWidget from './UpDownWidget.js';
import URLWidget from './URLWidget.js';

function widgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryWidgetsType<T, S, F> {
  return {
    AltDateWidget,
    AltDateTimeWidget,
    CheckboxWidget,
    CheckboxesWidget,
    ColorWidget,
    DateWidget,
    DateTimeWidget,
    EmailWidget,
    FileWidget,
    HiddenWidget,
    PasswordWidget,
    RadioWidget,
    RangeWidget,
    RatingWidget,
    SelectWidget,
    TextWidget,
    TextareaWidget,
    TimeWidget,
    UpDownWidget,
    URLWidget,
  };
}

export default widgets;
