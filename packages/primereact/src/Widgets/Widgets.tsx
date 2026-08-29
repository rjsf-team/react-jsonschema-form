import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AutoCompleteWidget from '../AutoCompleteWidget/AutoCompleteWidget.js';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget.js';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget.js';
import ColorWidget from '../ColorWidget/ColorWidget.js';
import PasswordWidget from '../PasswordWidget/PasswordWidget.js';
import RadioWidget from '../RadioWidget/RadioWidget.js';
import RangeWidget from '../RangeWidget/RangeWidget.js';
import SelectWidget from '../SelectWidget/SelectWidget.js';
import TextareaWidget from '../TextareaWidget/TextareaWidget.js';
import UpDownWidget from '../UpDownWidget/UpDownWidget.js';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryWidgetsType<T, S, F> {
  return {
    AutoCompleteWidget,
    CheckboxWidget,
    CheckboxesWidget,
    ColorWidget,
    PasswordWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
    UpDownWidget,
  };
}

export default generateWidgets();
