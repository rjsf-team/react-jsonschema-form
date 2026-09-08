import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate/index.ts';
import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate/index.ts';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate/index.ts';
import ArrayFieldTemplate from './ArrayFieldTemplate/ArrayFieldTemplate.tsx';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate/index.ts';
import BaseInputTemplate from './BaseInputTemplate/BaseInputTemplate.tsx';
import {
  AddButton,
  CopyButton,
  MoveDownButton,
  MoveUpButton,
  RemoveButton,
  SubmitButton,
  ClearButton,
} from './ButtonTemplates/index.ts';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate/index.ts';
import DescriptionField from './DescriptionField/index.ts';
import ErrorList from './ErrorList/index.ts';
import FieldErrorTemplate from './FieldErrorTemplate/index.ts';
import FieldHelpTemplate from './FieldHelpTemplate/index.ts';
import FieldTemplate from './FieldTemplate/index.ts';
import GridTemplate from './GridTemplate/GridTemplate.tsx';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate/index.ts';
import ObjectFieldTemplate from './ObjectFieldTemplate/index.ts';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate/index.ts';
import TitleFieldTemplate from './TitleField/TitleField.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate/index.ts';

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
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldItemButtonsTemplate,
    ArrayFieldTitleTemplate,
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    ButtonTemplates: {
      AddButton,
      SubmitButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      ClearButton,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    GridTemplate,
    MultiSchemaFieldTemplate,
    ObjectFieldTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

/** Default export of all generated templates for the DaisyUI theme */
export default generateTemplates();
