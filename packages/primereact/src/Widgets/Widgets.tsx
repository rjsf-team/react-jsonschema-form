import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AutoCompleteWidget from '../AutoCompleteWidget/AutoCompleteWidget';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget';
import ColorWidget from '../ColorWidget/ColorWidget';
import PasswordWidget from '../PasswordWidget/PasswordWidget';
import RadioWidget from '../RadioWidget/RadioWidget';
import RangeWidget from '../RangeWidget/RangeWidget';
import SelectWidget from '../SelectWidget/SelectWidget';
import TextareaWidget from '../TextareaWidget/TextareaWidget';
import UpDownWidget from '../UpDownWidget/UpDownWidget';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
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
