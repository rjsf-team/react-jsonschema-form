import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from './AddButton.tsx';
import { CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton } from './IconButton.tsx';
import SubmitButton from './SubmitButton.tsx';

function buttonTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): TemplatesType<T, S, F>['ButtonTemplates'] {
  return {
    SubmitButton,
    AddButton,
    CopyButton,
    MoveDownButton,
    MoveUpButton,
    RemoveButton,
    ClearButton,
  };
}

export default buttonTemplates;
