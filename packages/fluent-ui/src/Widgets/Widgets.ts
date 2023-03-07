import CheckboxWidget from '../CheckboxWidget/CheckboxWidget';
import CheckboxesWidget from '../CheckboxesWidget/CheckboxesWidget';
import ColorWidget from '../ColorWidget/ColorWidget';
import DateWidget from '../DateWidget/DateWidget';
import DateTimeWidget from '../DateTimeWidget/DateTimeWidget';
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
    CheckboxWidget,
    CheckboxesWidget,
    ColorWidget,
    DateWidget,
    DateTimeWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    TextareaWidget,
    UpDownWidget,
  };
}

export default generateWidgets();
