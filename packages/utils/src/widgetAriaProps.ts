import getControlAttributes from './getControlAttributes.ts';
import getSelectedOptionDescription from './getSelectedOptionDescription.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** The props of a `SelectWidget` from which the name and the description of the control it renders are built: the
 * `aria-label` and `aria-describedby` its caller may hand it, and the props that decide whether it shows the
 * description of its selected option
 */
export type WidgetAriaPropsInput<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = SelectedOptionDescriptionProps<T, S, F> & Pick<WidgetProps<T, S, F>, 'aria-label' | 'aria-describedby'>;

/** Return the `aria-label` and `aria-describedby` a `SelectWidget` gives the element a screen reader focuses. A widget
 * rendered inside another one, such as each select of an `AltDateWidget`, has no label of its own and an id that no
 * help or error element is rendered for, so only the caller can name it and link it to its field. The ids the caller
 * passed are followed by the selected option's description id only while `SelectedOptionDescription` renders it, the
 * one the widget renders itself, so the description of the selected option is still announced. Otherwise the id is
 * left out: no element has it, and it may be another field's description id, as `root_when_year__description` is for
 * both the year select of `when` and a `when_year` property. A select its field's plan reaches, with no ids from its
 * caller, takes the attributes `getControlAttributes()` gives its control, the selected option's description among
 * its describers while it renders.
 *
 * @param props - The widget's props, of which `id`, `presentation`, `aria-label`, `aria-describedby` and those
 *   `SelectedOptionDescription` reads are used
 * @returns - The `aria-label` and the attributes to spread on the focused element
 */
export default function widgetAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetAriaPropsInput<T, S, F>): Omit<ControlAttributes, 'required'> & { 'aria-label'?: string } {
  const { 'aria-label': ariaLabel, 'aria-describedby': callerDescribedBy } = props;
  const selected = getSelectedOptionDescription<T, S, F>(props);
  const ownDescribedBy = selected ? [selected.id] : [];
  if (!callerDescribedBy) {
    return { 'aria-label': ariaLabel, ...getControlAttributes<T, S, F>(props, ownDescribedBy) };
  }
  return { 'aria-label': ariaLabel, 'aria-describedby': [callerDescribedBy, ...ownDescribedBy].join(' ') };
}
