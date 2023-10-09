import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import TextareaWidget from '../TextareaWidget';
import CheckboxWidget from '../CheckboxWidget';
import CheckboxesWidget from '../CheckboxesWidget';
import RadioWidget from '../RadioWidget';
import SelectWidget from '../SelectWidget';

/** Generates a set of widgets `carbon` theme uses.
 */
export function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryWidgetsType<T, S, F> {
  return {
    TextareaWidget,
    CheckboxWidget,
    CheckboxesWidget,
    RadioWidget,
    SelectWidget,
  };
}

export default generateWidgets();
