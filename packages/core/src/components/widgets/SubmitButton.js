import React from "react";
import { getSubmitButtonProps } from ".././../utils";
export default function SubmitButton({ uiSchema }) {
  const { submitText, allowed, ...submitProps } = getSubmitButtonProps(
    uiSchema
  );
  return (
    <div>
      {allowed && (
        <button type="submit" {...submitProps}>
          {submitText}
        </button>
      )}
    </div>
  );
}
