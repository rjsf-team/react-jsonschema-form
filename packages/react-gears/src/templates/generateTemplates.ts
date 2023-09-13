import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';
import AddButton from './buttons/AddButton';
import SubmitButton from './buttons/SubmitButton';
import { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } from './buttons/IconButton';
import FieldTemplate from './FieldTemplate';
import FieldHelpTemplate from './FieldHelpTemplate';
import TitleFieldTemplate from './TitleFieldTemplate';
import DescriptionFieldTemplate from './DescriptionFieldTemplate';
import FieldErrorTemplate from './FieldErrorTemplate';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ButtonTemplates: {
      AddButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      SubmitButton,
    },
    DescriptionFieldTemplate,
    FieldTemplate,
    FieldErrorTemplate,
    FieldHelpTemplate,
    TitleFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
