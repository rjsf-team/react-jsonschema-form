import type { FormContextType, StrictRJSFSchema, RJSFSchema, ArrayFieldDescriptionProps } from '@rjsf/utils';
import { descriptionId, getUiOptions } from '@rjsf/utils';

/** The `ArrayFieldDescriptionTemplate` component renders the description for an array field
 * with DaisyUI styling, displaying it as a small text with accent color, with an `id` derived
 * from the field `id`, or the one the array's plan gives its description.
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  const { id, description, uiSchema, registry, presentation } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  // The plan has already decided whether `ui:label` hides the description
  const { label: displayLabel = true } = options;
  if (!description || (!presentation && !displayLabel)) {
    return null;
  }
  return (
    <div>
      <div id={presentation?.description.id ?? descriptionId(id)} className='text-sm text-accent'>
        {description}
      </div>
    </div>
  );
}
