import { WidgetProps } from "@rjsf/utils";

/** The `URLWidget` component uses the `BaseInputTemplate` changing the type to `url`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function URLWidget<T = any, F = any>(props: WidgetProps<T, F>) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate type="url" {...props} />;
}
