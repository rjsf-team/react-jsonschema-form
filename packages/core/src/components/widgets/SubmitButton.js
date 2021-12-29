import React from "react";
import { getSubmitButtonProps } from ".././../utils";
export default function SubmitButton({ uiSchema }) {
  const { submitText, required, ...submitProps } = getSubmitButtonProps(
    uiSchema
  );
  return (
    <div>
      {required && (
        <button type="submit" {...submitProps}>
          {submitText}
        </button>
      )}
    </div>
  );
}
