import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from '../AddButton/index.ts';
import BaseInputTemplate from '../BaseInputTemplate/BaseInputTemplate.tsx';
import CyclicSchemaExpandTemplate from '../CyclicSchemaExpandTemplate/index.ts';
import ErrorList from '../ErrorList/index.ts';
import GridTemplate from '../GridTemplate/index.ts';
import { CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton } from '../IconButton/index.ts';
import OptionalDataControlsTemplate from '../OptionalDataControlsTemplate/index.ts';
import SubmitButton from '../SubmitButton/index.ts';
import TitleField from '../TitleField/index.ts';
import WrapIfAdditionalTemplate from '../WrapIfAdditionalTemplate/index.ts';

/** The templates the theme renders itself, on its `components/ui` primitives or with markup of its own. The theme's
 * `classMap` styles the rest of core's templates
 */
export function createTemplates() {
  return {
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    ButtonTemplates: {
      AddButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      SubmitButton,
      ClearButton,
    },
    ErrorListTemplate: ErrorList,
    GridTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
  };
}

export function generateTemplates<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): Partial<TemplatesType<T, S, F>> {
  return createTemplates();
}

export default createTemplates();
