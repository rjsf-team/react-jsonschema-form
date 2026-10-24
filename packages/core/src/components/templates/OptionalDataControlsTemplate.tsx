import type { FormContextType, OptionalDataControlsTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { clsx } from 'clsx';

import IconButton from './ButtonTemplates/IconButton.tsx';

/** The OptionalDataControlsTemplate renders one of three different states. If
 * there is an `onAddClick()` function, it renders the "Add" button. If there is
 * an `onRemoveClick()` function, it renders the "Remove" button. Otherwise it
 * renders the "No data found" section. All of them use the `label` as either
 * the `title` of buttons or simply outputting it.
 *
 * @param props - The `OptionalDataControlsTemplateProps` for the template
 */
export default function OptionalDataControlsTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: OptionalDataControlsTemplateProps<T, S, F>) {
  const { id, registry, label, onAddClick, onRemoveClick } = props;
  const { classMap } = registry;
  if (onAddClick) {
    return (
      <IconButton
        id={id}
        registry={registry}
        icon='plus'
        className={clsx('rjsf-add-optional-data', classMap.optionalDataAddButton)}
        onClick={onAddClick}
        title={label}
      />
    );
  }
  if (onRemoveClick) {
    return (
      <IconButton
        id={id}
        registry={registry}
        icon='remove'
        className={clsx('rjsf-remove-optional-data', classMap.optionalDataRemoveButton)}
        onClick={onRemoveClick}
        title={label}
      />
    );
  }
  return <em id={id}>{label}</em>;
}
