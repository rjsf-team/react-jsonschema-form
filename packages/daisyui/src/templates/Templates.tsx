import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate/ArrayFieldTemplate';
import BaseInputTemplate from './BaseInputTemplate/BaseInputTemplate';
import { AddButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton, SubmitButton } from './ButtonTemplates';
import DescriptionField from './DescriptionField';
import ErrorList from './ErrorList';
import FieldErrorTemplate from './FieldErrorTemplate';
import FieldHelpTemplate from './FieldHelpTemplate';
import FieldTemplate from './FieldTemplate';
import GridTemplate from './GridTemplate/GridTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import TitleFieldTemplate from './TitleField/TitleField';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';

/** Function that generates all the template components required for the DaisyUI theme.
 *
 * This provides a complete set of styled components that implement the DaisyUI design system
 * for use with react-jsonschema-form.
 *
 * The templates include:
 * - Array field templates (for rendering array items and controls)
 * - Button templates (for add, submit, copy, move, remove actions)
 * - Input templates (for rendering form controls)
 * - Layout templates (for fields, objects, additional properties)
 * - Helper templates (for titles, descriptions, errors, help text)
 *
 * @returns A partial `TemplatesType` object with all required template components
 */
export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldItemButtonsTemplate,
    BaseInputTemplate,
    ButtonTemplates: {
      AddButton,
      SubmitButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    GridTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

/** Default export of all generated templates for the DaisyUI theme */
export default generateTemplates();
