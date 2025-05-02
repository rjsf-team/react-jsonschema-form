import AddButton from './AddButton';
import CopyButton from './CopyButton';
import MoveDownButton from './MoveDownButton';
import MoveUpButton from './MoveUpButton';
import RemoveButton from './RemoveButton';
import SubmitButton from './SubmitButton'; // Import SubmitButton
import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

export function generateButtonTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): TemplatesType<T, S, F>['ButtonTemplates'] {
  return {
    AddButton,
    CopyButton,
    MoveDownButton,
    MoveUpButton,
    RemoveButton,
    SubmitButton, // Export SubmitButton
  };
}

export default generateButtonTemplates();
