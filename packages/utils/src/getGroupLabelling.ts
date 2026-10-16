import getGroupAttributes from './getGroupAttributes.ts';
import type { GroupRole } from './getGroupAttributes.ts';
import { fieldLabelId } from './idGenerators.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import widgetDrawsLabel from './widgetDrawsLabel.ts';

/** Gets what a widget rendering a group of controls, such as radios or checkboxes, needs to draw its own label for the
 * group and to label the group by it: whether it draws one, the id it draws it under, and the attributes
 * `getGroupAttributes()` gives the group and each control in it, given that label's id where the widget draws one. The
 * label is drawn with no `for`, which can't name the group's wrapper, so the group points `aria-labelledby` at it
 * instead, where its field's plan names the group by no other label. A widget draws the label where
 * `widgetDrawsLabel()` says it does and it has text; a group whose label `ui:label: false` hides is named by the
 * `aria-label` its plan gives it
 *
 * @param props - The widget's `id`, `label`, `hideLabel` and `presentation`
 * @param role - The role of the group's wrapper
 * @returns - `drawsLabel` and `labelId` for the label, and the `group` and `option` attributes
 */
export default function getGroupLabelling<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'id' | 'label' | 'hideLabel' | 'presentation'>, role: GroupRole) {
  const { id, label, presentation } = props;
  const labelId = fieldLabelId(id);
  const drawsLabel = widgetDrawsLabel<T, S, F>(props) && !!label;
  const { group, option } = getGroupAttributes<T, S, F>({ id, presentation }, role, drawsLabel ? labelId : undefined);
  return { drawsLabel, labelId, group, option };
}
