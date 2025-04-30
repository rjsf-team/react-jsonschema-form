import { ArrayFieldDescriptionProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import Markdown from 'markdown-to-jsx';

/** The `ArrayFieldDescriptionTemplate` component renders the description for an array field
 *
 * @param props - The `ArrayFieldDescriptionProps` for this component
 */
export default function ArrayFieldDescriptionTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  const { description, idSchema, schema, uiSchema, registry } = props;

  if (!description) {
    return null;
  }

  // Add checks for idSchema and idSchema.$id
  const id = idSchema && idSchema.$id ? `${idSchema.$id}__description` : undefined;

  // Check if description is a string for Markdown processing
  if (typeof description === 'string') {
    return (
      <div id={id} className="usa-prose"> {/* Use usa-prose for USWDS typography */}
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
            },
            // Add other USWDS-specific element styling as needed
          }
        }}>
          {description}
        </Markdown>
      </div>
    );
  }

  // If not a string (e.g., React element), render directly
  return <div id={id}>{description}</div>;
}
