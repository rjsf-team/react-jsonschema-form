import type { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { Message } from 'semantic-ui-react';

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
          // oxlint-disable-next-line react/no-array-index-key
          <Message.Item key={`error-${index}`}>{error.stack}</Message.Item>
        ))}
      </Message.List>
    </Message>
  );
}
