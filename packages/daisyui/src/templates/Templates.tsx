import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate/index.js';
import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate/index.js';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate/index.js';
import ArrayFieldTemplate from './ArrayFieldTemplate/ArrayFieldTemplate.js';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate/index.js';
import BaseInputTemplate from './BaseInputTemplate/BaseInputTemplate.js';
import {
  AddButton,
  CopyButton,
  MoveDownButton,
  MoveUpButton,
  RemoveButton,
  SubmitButton,
  ClearButton,
} from './ButtonTemplates/index.js';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate/index.js';
import DescriptionField from './DescriptionField/index.js';
import ErrorList from './ErrorList/index.js';
import FieldErrorTemplate from './FieldErrorTemplate/index.js';
import FieldHelpTemplate from './FieldHelpTemplate/index.js';
import FieldTemplate from './FieldTemplate/index.js';
import GridTemplate from './GridTemplate/GridTemplate.js';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate/index.js';
import ObjectFieldTemplate from './ObjectFieldTemplate/index.js';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate/index.js';
import TitleFieldTemplate from './TitleField/TitleField.js';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate/index.js';

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
