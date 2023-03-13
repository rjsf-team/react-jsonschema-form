import { Message } from 'semantic-ui-react';
import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Message negative>
      <Message.Header>{translateString(TranslatableString.ErrorsLabel)}</Message.Header>
      <Message.List>
        {errors.map((error, index) => (
          <Message.Item key={`error-${index}`}>{error.stack}</Message.Item>
        ))}
      </Message.List>
    </Message>
  );
}
