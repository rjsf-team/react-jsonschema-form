import {
  DescriptionFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  RichDescription,
} from '@rjsf/utils';
import React from 'react'; // Import React if needed for complex rendering

export default function DescriptionFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, registry, uiSchema } = props; // Destructure only needed props

  if (!description) {
    return null;
  }

  // Render the description directly within the hint div
  // If markdown or complex rendering is needed, add a library like react-markdown
  return (
    <div id={id} className="usa-hint">
      <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
