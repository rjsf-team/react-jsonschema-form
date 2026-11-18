import schemaRequiresTrueValue from './schemaRequiresTrueValue.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets how a checkbox is required. The box is natively required only where the schema demands `true`, as
 * `schemaRequiresTrueValue()` decides, since HTML5 constraint validation fails an unchecked required box. Where the
 * widget has a plan, its label is marked as its `required` prop says, which `SchemaField` sets from the plan and which
 * takes in a box `ui:required` asks of that holds no value yet; RJSF's own check covers that box, and `aria-required`
 * tells a screen reader of it. Without a plan, the label is marked only where the box is natively required.
 *
 * @param props - The widget's `schema`, `required` and `presentation`
 * @returns - `trueValueRequired`, for the box's native `required`, and `marksRequired`, for its label's marker
 */
export default function getCheckboxRequired<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'schema' | 'required' | 'presentation'>,
): { trueValueRequired: boolean; marksRequired: boolean } {
  const { schema, required = false, presentation } = props;
  const trueValueRequired = schemaRequiresTrueValue<S>(schema) && required;
  return { trueValueRequired, marksRequired: presentation?.control ? required : trueValueRequired };
}
