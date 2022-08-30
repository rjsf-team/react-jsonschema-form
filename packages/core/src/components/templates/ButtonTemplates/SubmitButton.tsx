import React from "react";
import { getSubmitButtonOptions, SubmitButtonProps } from "@rjsf/utils";

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<T, F>({
  uiSchema,
}: SubmitButtonProps<T, F>) {
  const {
    submitText,
    norender,
    props: submitButtonProps = {},
  } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <div>
      <button
        type="submit"
        {...submitButtonProps}
        className={`btn btn-info ${submitButtonProps.className}`}
      >
        {submitText}
      </button>
    </div>
  );
}
