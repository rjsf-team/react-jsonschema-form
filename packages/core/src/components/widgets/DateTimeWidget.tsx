import { localToUTC, utcToLocal, WidgetProps } from "@rjsf/utils";

/** The `DateTimeWidget` component uses the `BaseInputTemplate` changing the type to `datetime-local` and transforms
 * the value to/from utc using the appropriate utility functions.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const {
    onChange,
    value,
    registry: {
      templates: { BaseInputTemplate },
    },
  } = props;
  return (
    <BaseInputTemplate
      type="datetime-local"
      {...props}
      value={utcToLocal(value)}
      onChange={(value) => onChange(localToUTC(value))}
    />
  );
}
