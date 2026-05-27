import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget';
import AltDateWidget from './AltDateWidget';
import CheckboxesWidget from './CheckboxesWidget';
import CheckboxWidget from './CheckboxWidget';
import ColorWidget from './ColorWidget';
import DateTimeWidget from './DateTimeWidget';
import DateWidget from './DateWidget';
import EmailWidget from './EmailWidget';
import FileWidget from './FileWidget';
import HiddenWidget from './HiddenWidget';
import PasswordWidget from './PasswordWidget';
import RadioWidget from './RadioWidget';
import RangeWidget from './RangeWidget';
import RatingWidget from './RatingWidget';
import SelectWidget from './SelectWidget';
import TextareaWidget from './TextareaWidget';
import TextWidget from './TextWidget';
import TimeWidget from './TimeWidget';
import UpDownWidget from './UpDownWidget';
import URLWidget from './URLWidget';

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
