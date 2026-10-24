import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  templateDrawsDescription,
  templateDrawsLabel,
  templateLabelFor,
  templateMarksRequired,
} from '@rjsf/utils';
import { clsx } from 'clsx';

import Label from './Label.tsx';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const { label, children, errors, help, description, hidden, hasErrors, registry, uiSchema, presentation } = props;
  const { classMap } = registry;
  const uiOptions = getUiOptions(uiSchema);
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  if (hidden) {
    return <div className='hidden'>{children}</div>;
  }
  // The plan's label already says whether a checkbox draws its own; the guess by the `checkbox` alias is left for a
  // template rendered without one, which `getDisplayLabel()` still tells to draw it, as the themes' templates do
  const leavesLabelToCheckbox = !presentation && uiOptions.widget === 'checkbox';
  return (
    <WrapIfAdditionalTemplate {...props}>
      {templateDrawsLabel<T, S, F>(props) && !leavesLabelToCheckbox && (
        <Label
          label={label}
          required={templateMarksRequired<T, S, F>(props)}
          id={templateLabelFor<T, S, F>(props)}
          labelId={presentation?.label.id}
          className={clsx(classMap.fieldLabel, hasErrors && classMap.labelError)}
        />
      )}
      {templateDrawsDescription<T, S, F>(props) && description}
      {children}
      {errors}
      {help}
    </WrapIfAdditionalTemplate>
  );
}
