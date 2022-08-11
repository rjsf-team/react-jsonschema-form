import { WidgetProps } from "@rjsf/utils";

/** The `EmailWidget` component uses the `BaseInputTemplate` changing the type to `email`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function EmailWidget<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate type="email" {...props} />;
}
