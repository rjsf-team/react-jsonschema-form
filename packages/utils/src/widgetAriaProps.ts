import getControlAriaLabel from './getControlAriaLabel.ts';
import getControlAttributes from './getControlAttributes.ts';
import getSelectedOptionDescription from './getSelectedOptionDescription.ts';
import { rendersHere } from './resolveFieldPresentation.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type {
  ControlAttributes,
  FieldPresentation,
  FormContextType,
  PartPresentation,
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

/** Lists `selectedId` in `ids` under `placement`, as `widgetAriaProps()` describes. The parts of the plan and of the plans
 * above it are drawn around the select, so those drawn above it go before the id and the others after it, wherever the
 * plan lists them. An id that is no part, such as the errors' or a caller's, keeps its place around them
 */
function listSelectedOption(
  ids: readonly string[],
  selectedId: string,
  presentation: FieldPresentation,
  placement: SelectedOptionDescriptionPlacement,
) {
  // shortcut: only this id is placed, as the plan's `describedBy` lists inherited parts first for every control; move
  // the ordering into `resolveFieldPresentation()` if other controls' or parts' announced order needs to match too
  const above = new Set<string>();
  const below = new Set<string>();
  const isPart = (id: string) => above.has(id) || below.has(id);
  for (let plan: FieldPresentation | undefined = presentation; plan; plan = plan.inherited) {
    const isPlanAbove = plan !== presentation;
    const place = ({ by, id }: PartPresentation, drawnBelow: boolean) => {
      // The nearest plan decides, since a selector's plan repeats the parts its field draws itself as its own
      if (rendersHere(by) && !isPart(id)) {
        // A part a field above draws itself, as an `anyOf`/`oneOf` field's selector does, is drawn above the select
        (drawnBelow && !(isPlanAbove && by === 'self') ? below : above).add(id);
      }
    };
    place(plan.description, placement === 'beforeDescription');
    place(plan.help, placement !== 'afterHelp');
  }
  const describers = ids.filter((id) => id !== selectedId);
  const firstPart = describers.findIndex(isPart);
  const listed = describers.filter((id) => !isPart(id));
  listed.splice(
    firstPart === -1 ? listed.length : firstPart,
    0,
    ...describers.filter((id) => above.has(id)),
    selectedId,
    ...describers.filter((id) => below.has(id)),
  );
  return listed;
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
 * draws it, so a screen reader announces it in the order it is shown, among the description and help of its plan and
 * of the plans above it: after the descriptions and before the helps, before the descriptions as well under
 * `'beforeDescription'`, or after them all under `'afterHelp'`, for a template that draws the help above the widget. With
 * none of them it is listed last. A part a field above draws itself, as an `anyOf`/`oneOf` field's selector does above
 * the select, is listed before it whatever the placement.
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
    const placement = props.registry.presentation?.selectedOptionDescription ?? 'afterDescription';
    attributes['aria-describedby'] = listSelectedOption(
      attributes['aria-describedby']!.split(' '),
      selected.id,
      presentation,
      placement,
    ).join(' ');
  }
  return {
    ...attributes,
    'aria-label': getControlAriaLabel<T, S, F>(props, ariaLabel || attributes['aria-label']),
  };
}
