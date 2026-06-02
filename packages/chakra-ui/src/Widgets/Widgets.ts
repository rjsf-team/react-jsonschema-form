import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from '../AltDateTimeWidget/AltDateTimeWidget';
import AltDateWidget from '../AltDateWidget/AltDateWidget';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget';
import NativeSelectWidget from '../NativeSelectWidget/NativeSelectWidget';
import RadioWidget from '../RadioWidget/RadioWidget';
import RangeWidget from '../RangeWidget/RangeWidget';
import SelectWidget from '../SelectWidget/SelectWidget';
import TextareaWidget from '../TextareaWidget/TextareaWidget';
import UpDownWidget from '../UpDownWidget/UpDownWidget';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): RegistryWidgetsType<T, S, F> {
  return {
    AltDateTimeWidget,
    AltDateWidget,
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    NativeSelectWidget,
    TextareaWidget,
    UpDownWidget,
  };
}

export default generateWidgets();
