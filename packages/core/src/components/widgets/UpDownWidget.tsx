import { WidgetProps } from "@rjsf/utils";

/** The `UpDownWidget` component uses the `BaseInputTemplate` changing the type to `number`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function UpDownWidget<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate type="number" {...props} />;
}
