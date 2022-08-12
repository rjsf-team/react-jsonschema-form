import { Component } from "react";
import { FieldProps } from "@rjsf/utils";

/** The `NullField` component is used to render a field in the schema is null. It also ensures that the `formData` is
 * also set to null if it has no value.
 *
 * @param props - The `FieldProps` for this template
 */
class NullField<T = any, F = any> extends Component<FieldProps<T, F>> {
  /** React lifecycle method is called after a component mounts. Will convert an undefined formData to a null via the
   * onChange callback
   */
  componentDidMount() {
    const { formData, onChange } = this.props;
    if (formData === undefined) {
      onChange(null as unknown as T);
    }
  }

  /** Renders null for the null field
   */
  render() {
    return null;
  }
}

export default NullField;
