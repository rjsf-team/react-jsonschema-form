import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates } from '@rjsf/utils';

/** The `PasswordWidget` component uses the `BaseInputTemplate` changing the type to `password`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { options, registry } = props;
  const { BaseInputTemplate } = getTemplates<T, S, F>(registry, options);
  return <BaseInputTemplate type='password' {...props} />;
}
