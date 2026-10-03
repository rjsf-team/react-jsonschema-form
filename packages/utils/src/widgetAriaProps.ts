import { ariaDescribedByIds } from './idGenerators.ts';

/** The props a widget may be handed by its caller to name and describe the control it renders */
export interface WidgetAriaPropsInput {
  /** The id of the widget, from which the default `aria-describedby` is built */
  id: string;
  /** An accessible name chosen by the caller */
  'aria-label'?: string;
  /** The ids describing the control, chosen by the caller */
  'aria-describedby'?: string;
}

/** Return the `aria-label` and `aria-describedby` a widget gives the element a screen reader focuses. What the caller
 * passed wins over the widget's own default: a widget rendered inside another one, such as each select of an
 * `AltDateWidget`, has no label of its own and an id that no description, help or error element is rendered for, so
 * only the caller can name it and link it to its field. A widget that builds its own description list, such as one
 * that also describes the value it displays, passes it as `describedBy`.
 *
 * @param props - The widget's props, of which only `id`, `aria-label` and `aria-describedby` are read
 * @param [describedBy=ariaDescribedByIds(props.id)] - The `aria-describedby` to use when the caller passed none
 * @returns - The `aria-label` and `aria-describedby` to spread on the focused element
 */
export default function widgetAriaProps(props: WidgetAriaPropsInput, describedBy = ariaDescribedByIds(props.id)) {
  return { 'aria-label': props['aria-label'], 'aria-describedby': props['aria-describedby'] ?? describedBy };
}
