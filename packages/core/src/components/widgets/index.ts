import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget.tsx';
import AltDateWidget from './AltDateWidget.tsx';
import CheckboxesWidget from './CheckboxesWidget.tsx';
import CheckboxWidget from './CheckboxWidget.tsx';
import ColorWidget from './ColorWidget.tsx';
import DateTimeWidget from './DateTimeWidget.tsx';
import DateWidget from './DateWidget.tsx';
import EmailWidget from './EmailWidget.tsx';
import FileWidget from './FileWidget.tsx';
import HiddenWidget from './HiddenWidget.tsx';
import PasswordWidget from './PasswordWidget.tsx';
import RadioWidget from './RadioWidget.tsx';
import RangeWidget from './RangeWidget.tsx';
import RatingWidget from './RatingWidget.tsx';
import SelectWidget from './SelectWidget.tsx';
import TextareaWidget from './TextareaWidget.tsx';
import TextWidget from './TextWidget.tsx';
import TimeWidget from './TimeWidget.tsx';
import UpDownWidget from './UpDownWidget.tsx';
import URLWidget from './URLWidget.tsx';

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
