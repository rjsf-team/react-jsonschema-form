import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FormContextType, OptionalDataControlsTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { RemoveButton } from '../ButtonTemplates';
import DaisyUIButton from '../ButtonTemplates/DaisyUIButton';

/** The OptionalDataControlsTemplate renders one of three different states. If
 * there is an `onAddClick()` function, it renders the "Add" button. If there is
 * an `onRemoveClick()` function, it renders the "Remove" button. Otherwise it
 * renders the "No data found" section. All of them use the `label` as either
 * the `title` of buttons or simply outputting it.
 *
 * @param props - The `OptionalDataControlsTemplateProps` for the template
 */
export default function OptionalDataControlsTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: OptionalDataControlsTemplateProps<T, S, F>) {
  const { registry, label, onAddClick, onRemoveClick } = props;
  if (onAddClick) {
    return (
      <DaisyUIButton
        registry={registry}
        iconType='info'
        icon={faPlus as IconDefinition}
        className='rjsf-add-optional-data'
        onClick={onAddClick}
        title={label}
      />
    );
  } else if (onRemoveClick) {
    return (
      <RemoveButton registry={registry} className='rjsf-remove-optional-data' onClick={onRemoveClick} title={label} />
    );
  }
  return <em>{label}</em>;
}
