import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from './AltDateTimeWidget/index.tsx';
import AltDateWidget from './AltDateWidget/index.tsx';
import CheckboxesWidget from './CheckboxesWidget/index.tsx';
import CheckboxWidget from './CheckboxWidget/index.tsx';
import DateTimeWidget from './DateTimeWidget/index.tsx';
import DateWidget from './DateWidget/index.tsx';
import PasswordWidget from './PasswordWidget/index.tsx';
import RadioWidget from './RadioWidget/index.tsx';
import RangeWidget from './RangeWidget/index.tsx';
import SelectWidget from './SelectWidget/index.tsx';
import TextareaWidget from './TextareaWidget/index.tsx';

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
