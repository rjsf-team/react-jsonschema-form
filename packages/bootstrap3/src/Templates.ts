import { SubmitButton } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from './AddButton.tsx';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.tsx';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate.tsx';
import { ClearButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton } from './IconButton.tsx';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate.tsx';
import TitleField from './TitleField.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate.tsx';

/** The templates whose markup is Bootstrap 3's rather than a class name on `@rjsf/core`'s: the glyphicon buttons, the
 * templates rendering them directly, the `col-xs-*` layouts, and the cyclic-schema box's margin, which core leaves to
 * `rjsf.css`
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
    CyclicSchemaExpandTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
  };
}

/** @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme */
// oxlint-disable-next-line typescript/no-deprecated -- the package's own export, deprecated with it
export default generateTemplates();
