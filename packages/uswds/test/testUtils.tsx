import React from "react";
import { render } from "@testing-library/react";
import { FormProps } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

import Theme from "../src/Theme"; // Import the USWDS theme
import Form from "../src/Form"; // Import the USWDS Form

export function createFormComponent<T = any>(props: FormProps<T>) {
  return render(<Form validator={validator} {...props} theme={Theme} />);
}

// You can add other common test utilities here if needed
