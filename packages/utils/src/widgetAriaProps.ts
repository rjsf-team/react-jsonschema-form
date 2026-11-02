import getControlAriaLabel from './getControlAriaLabel.ts';
import getControlAttributes from './getControlAttributes.ts';
import getSelectedOptionDescription from './getSelectedOptionDescription.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type {
  ControlAttributes,
  FormContextType,
  RJSFSchema,
  SelectedOptionDescriptionPlacement,
  StrictRJSFSchema,
  WidgetProps,
} from './types.ts';
import uniqueIds from './uniqueIds.ts';

/** The props of a `SelectWidget` from which the name and the description of the control it renders are built: the
 * `aria-label` and `aria-describedby` its caller may hand it, the `label` and `placeholder` it is named by where no
 * label names it, and the props that decide whether it shows the description of its selected option
 */
export type WidgetAriaPropsInput<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = SelectedOptionDescriptionProps<T, S, F> &
  Pick<WidgetProps<T, S, F>, 'aria-label' | 'aria-describedby' | 'label' | 'placeholder'>;

/** The index in `ids` at which the selected option's description id is listed under `placement`, as
 * `widgetAriaProps()` describes
 */
function insertionIndex(
  ids: readonly string[],
  descriptionId: string,
  helpId: string,
  placement: SelectedOptionDescriptionPlacement,
) {
  const descriptionAt = ids.indexOf(descriptionId);
  const helpAt = ids.indexOf(helpId);
  if (placement === 'afterHelp' && helpAt !== -1) {
    return helpAt + 1;
  }
  if (descriptionAt !== -1) {
    return placement === 'beforeDescription' ? descriptionAt : descriptionAt + 1;
  }
  return helpAt !== -1 ? helpAt : ids.length;
}

/** Return the `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-invalid` a `SelectWidget` gives the element
 * a screen reader focuses, all of which belong on that element. A select its field's plan reaches takes the attributes
 * `getControlAttributes()` gives its control, with the ids its caller passed, then the selected option's description
 * id, added to the plan's describers, each id once, and the caller's `aria-label` over the plan's unless it is empty,
 * else, since a select shows its value rather than a name, the name `getControlAriaLabel()` gives it where no label
 * names it. A select rendered inside another widget, such as each date part of an
 * `AltDateWidget`, has an id of its own that no help or error element is rendered for, so it is given a plan of its
 * own, through which it is described by its field's parts. Without a plan, the caller's ids, even an empty
 * `aria-describedby`, replace the `ariaDescribedByIds()` a widget rendered without one falls back to, whose ids no
 * element may have.
 *
 * The selected option's description id is added only while `SelectedOptionDescription` renders it, the one element the
 * widget renders itself, so the description of the selected option is still announced. Otherwise the id is left out,
 * since no element has it. Under a plan it is listed where the theme's `selectedOptionDescription` says the widget
 * draws it, so a screen reader announces it in the order it is shown: just after the plan's description id, or just
 * before it under `'beforeDescription'`, and where the plan shows no description, just before its help id, else last.
 * Under `'afterHelp'`, for a template that draws the help above the widget, it is listed just after the help id, else
 * after the description id, else last. A description the field above draws itself, as an `anyOf`/`oneOf` field's
 * selector does above the select, is listed before the option's under `'beforeDescription'` too.
 *
 * @param props - The widget's props, of which `id`, `presentation`, `aria-label`, `aria-describedby`, `label`,
 *   `placeholder` and those `SelectedOptionDescription` reads are used
 * @returns - The `aria-label` and the attributes to spread on the focused element
 */
export default function widgetAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetAriaPropsInput<T, S, F>): Omit<ControlAttributes, 'required'> {
  const { 'aria-label': ariaLabel, 'aria-describedby': callerDescribedBy, presentation } = props;
  const selected = getSelectedOptionDescription<T, S, F>(props);
  const addedDescribedBy = [...(callerDescribedBy?.split(' ') ?? []), ...(selected ? [selected.id] : [])];
  const attributes: Omit<ControlAttributes, 'required'> =
    callerDescribedBy !== undefined && !presentation
      ? { 'aria-describedby': uniqueIds(addedDescribedBy).join(' ') || undefined }
      : getControlAttributes<T, S, F>(props, addedDescribedBy);
  // Without a plan, the selected option's description renders under the field's description id, so there is no order
  if (selected && presentation) {
    const declared = props.registry.presentation?.selectedOptionDescription ?? 'afterDescription';
    // A description the field above draws itself, as an `anyOf`/`oneOf` field's selector does, is drawn above the
    // select, so the option's description follows it wherever the theme's select draws it
    const { description } = presentation;
    // A nested `anyOf` passes the description down through levels that are `above` themselves
    let drawer = presentation.inherited;
    while (drawer && !(drawer.description.id === description.id && drawer.description.by !== 'above')) {
      drawer = drawer.inherited;
    }
    const drawnAbove = description.by === 'above' && drawer?.description.by === 'self';
    const placement = declared === 'beforeDescription' && drawnAbove ? 'afterDescription' : declared;
    const ids = attributes['aria-describedby']!.split(' ').filter((describer) => describer !== selected.id);
    ids.splice(insertionIndex(ids, presentation.description.id, presentation.help.id, placement), 0, selected.id);
    attributes['aria-describedby'] = ids.join(' ');
  }
  return {
    ...attributes,
    'aria-label': getControlAriaLabel<T, S, F>(props, ariaLabel || attributes['aria-label']),
  };
}
