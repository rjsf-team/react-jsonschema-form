import React from 'react';
import { DescriptionFieldProps, GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils'; // Import GenericObjectType
import { JSONSchema7 } from 'json-schema';
import Markdown from 'markdown-to-jsx';

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function FieldDescriptionTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends GenericObjectType = any, // Add constraint
>(
  props: DescriptionFieldProps<T, S, F>,
) {
  const { id, description } = props;
  
  if (!description) {
    return null;
  }

  // If description is not a string (e.g. a React element), render it directly
  if (typeof description !== 'string') {
    return <div id={id} className="usa-prose">{description}</div>;
  }

  // For string descriptions, use markdown-to-jsx to render with full markdown support
  return (
    <div id={id} className="usa-prose">
      <Markdown options={{
        overrides: {
          a: {
            props: {
              className: 'usa-link',
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          },
          code: {
            props: {
              className: 'usa-code'
            }
          }
          // Add other USWDS-specific element styling as needed
        }
      }}>
        {description}
      </Markdown>
    </div>
  );
}
