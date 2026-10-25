import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate/index.ts';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate/index.ts';
import ArrayFieldTemplate from './ArrayFieldTemplate/ArrayFieldTemplate.tsx';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate/index.ts';
import FieldTemplate from './FieldTemplate/index.ts';
import GridTemplate from './GridTemplate/GridTemplate.tsx';
import ObjectFieldTemplate from './ObjectFieldTemplate/index.ts';
import TitleFieldTemplate from './TitleField/TitleField.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate/index.ts';

export function createTemplates() {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldItemButtonsTemplate,
    ArrayFieldTitleTemplate,
    FieldTemplate,
    GridTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

/** Function that generates the template components the DaisyUI theme renders itself: the ones whose markup differs
 * from `@rjsf/core`'s. The theme's `classMap` styles the rest of core's templates and buttons.
 *
 * @returns A partial `TemplatesType` object with the theme's template components
 */
export function generateTemplates<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): Partial<TemplatesType<T, S, F>> {
  return createTemplates();
}

/** Default export of all generated templates for the DaisyUI theme */
export default createTemplates();
