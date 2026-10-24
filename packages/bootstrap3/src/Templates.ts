import { SubmitButton } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from './AddButton.tsx';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.tsx';
import { ClearButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton } from './IconButton.tsx';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate.tsx';
import TitleField from './TitleField.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate.tsx';

/** The templates whose markup is Bootstrap 3's rather than a class name on `@rjsf/core`'s: the glyphicon buttons, the
 * templates rendering them directly, and the `col-xs-*` layouts
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
export function generateTemplates<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ArrayFieldItemTemplate,
    // `buildRegistry()` would fill in core's `SubmitButton` anyway; it is listed so `ButtonTemplates` is complete, as
    // `Partial<TemplatesType>` requires, and `ThemeProps['templates']` can't type a partial one's entries for JSX
    ButtonTemplates: { AddButton, ClearButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton, SubmitButton },
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
  };
}

/** @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme */
export default generateTemplates();
