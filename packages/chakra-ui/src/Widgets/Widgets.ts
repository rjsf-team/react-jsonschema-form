import AltDateTimeWidget from '../AltDateTimeWidget/AltDateTimeWidget';
import AltDateWidget from '../AltDateWidget/AltDateWidget';
import CheckboxWidget from '../CheckboxWidget/CheckboxWidget';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget';
import RadioWidget from '../RadioWidget/RadioWidget';
import RangeWidget from '../RangeWidget/RangeWidget';
import SelectWidget from '../SelectWidget/SelectWidget';
import TextareaWidget from '../TextareaWidget/TextareaWidget';
import UpDownWidget from '../UpDownWidget/UpDownWidget';
import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryWidgetsType<T, S, F> {
  return {
    AltDateTimeWidget,
    AltDateWidget,
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
    UpDownWidget,
  };
}

export default generateWidgets();
