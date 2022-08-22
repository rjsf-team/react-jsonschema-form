import { useEffect } from "react";
import { FieldProps } from "@rjsf/utils";

/** The `NullField` component is used to render a field in the schema is null. It also ensures that the `formData` is
 * also set to null if it has no value.
 *
 * @param props - The `FieldProps` for this template
 */
function NullField<T = any, F = any>(props: FieldProps<T, F>) {
  const { formData, onChange } = props;
  useEffect(() => {
    if (formData === undefined) {
      onChange(null as unknown as T);
    }
  }, [formData, onChange]);

  return null;
}

export default NullField;
