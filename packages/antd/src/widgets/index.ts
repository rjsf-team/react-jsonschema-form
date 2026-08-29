import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget/index.js';
import AltDateWidget from './AltDateWidget/index.js';
import CheckboxesWidget from './CheckboxesWidget/index.js';
import CheckboxWidget from './CheckboxWidget/index.js';
import DateTimeWidget from './DateTimeWidget/index.js';
import DateWidget from './DateWidget/index.js';
import PasswordWidget from './PasswordWidget/index.js';
import RadioWidget from './RadioWidget/index.js';
import RangeWidget from './RangeWidget/index.js';
import SelectWidget from './SelectWidget/index.js';
import TextareaWidget from './TextareaWidget/index.js';

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
    DateTimeWidget,
    DateWidget,
    PasswordWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
  };
}

export default generateWidgets();
