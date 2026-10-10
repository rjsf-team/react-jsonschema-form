import { ariaDescribedByIds, descriptionId } from './idGenerators.ts';
import type { WidgetProps } from './types.ts';

/** The props a widget may be handed by its caller to name and describe the control it renders */
export interface WidgetAriaPropsInput {
  /** The id of the widget, from which its own `aria-describedby` ids are built */
  id: string;
  /** An accessible name chosen by the caller */
  'aria-label'?: string;
  /** The ids describing the control, chosen by the caller */
  'aria-describedby'?: string;
  /** The widget's options, whose `enumOptions` say whether any option has a description to announce */
  options?: Pick<WidgetProps['options'], 'enumOptions'>;
}

/** Return the `aria-label` and `aria-describedby` a `SelectWidget` gives the element a screen reader focuses. A widget
 * rendered inside another one, such as each select of an `AltDateWidget`, has no label of its own and an id that no
 * help or error element is rendered for, so only the caller can name it and link it to its field. When any of its
 * options has a description, the ids the caller passed are followed by `descriptionId(props.id)`, the one element the
 * widget renders itself, for the description of the option it has selected, so that description is still announced.
 * A select with no described option renders no such element, and its id may be another field's description id, as
 * `root_when_year__description` is for both the year select of `when` and a `when_year` property.
 *
 * @param props - The widget's props, of which only `id`, `aria-label`, `aria-describedby` and `options` are read
 * @returns - The `aria-label` and `aria-describedby` to spread on the focused element
 */
export default function widgetAriaProps(props: WidgetAriaPropsInput) {
  const { id, 'aria-label': ariaLabel, 'aria-describedby': callerDescribedBy, options } = props;
  if (!callerDescribedBy) {
    return { 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedByIds(id) };
  }
  const hasDescribedOption = options?.enumOptions?.some((option) => option.schema?.description);
  const describedBy = hasDescribedOption ? `${callerDescribedBy} ${descriptionId(id)}` : callerDescribedBy;
  return { 'aria-label': ariaLabel, 'aria-describedby': describedBy };
}
