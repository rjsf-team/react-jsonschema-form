import type { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import AltDateTimeWidget from '../AltDateTimeWidget/AltDateTimeWidget.js';
import AltDateWidget from '../AltDateWidget/AltDateWidget.js';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget.js';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget.js';
import NativeSelectWidget from '../NativeSelectWidget/NativeSelectWidget.js';
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
