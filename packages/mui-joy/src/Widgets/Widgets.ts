import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxWidget from '../CheckboxWidget/CheckboxWidget';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget';
import RadioWidget from '../RadioWidget/RadioWidget';
import RangeWidget from '../RangeWidget/RangeWidget';
import SelectWidget from '../SelectWidget/SelectWidget';
import TextareaWidget from '../TextareaWidget/TextareaWidget';
import AltDateWidget from '../AltDateWidget/AltDateWidget';
import AltDateTimeWidget from '../AltDateTimeWidget/AltDateTimeWidget';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryWidgetsType<T, S, F> {
  return {
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
    AltDateWidget,
    AltDateTimeWidget,
  };
}

export default generateWidgets();
