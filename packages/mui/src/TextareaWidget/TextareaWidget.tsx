import type { FormContextType, RJSFSchema, SlotComponent, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates } from '@rjsf/utils';

import type { MuiBaseInputTemplateProps } from '../BaseInputTemplate/BaseInputTemplate.tsx';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { options, registry } = props;
  const BaseInputTemplate: SlotComponent<MuiBaseInputTemplateProps<T, S, F>> = getTemplates<T, S, F>(
    registry,
    options,
  ).BaseInputTemplate;

  let rows: string | number = 5;
  if (typeof options.rows === 'string' || typeof options.rows === 'number') {
    rows = options.rows;
  }

  return <BaseInputTemplate {...props} multiline rows={rows} />;
}
