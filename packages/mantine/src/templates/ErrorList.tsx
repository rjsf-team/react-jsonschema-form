import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { Alert, Title, List } from '@mantine/core';
import { ExclamationCircle } from './icons';

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
    <Alert
      color='red'
      variant='transparent'
      title={
        <Title order={5} fw='normal'>
          {translateString(TranslatableString.ErrorsLabel)}
        </Title>
      }
      icon={<ExclamationCircle />}
    >
      <List>
        {errors.map((error, index) => (
          <List.Item key={`error-${index}`} c='red'>
            {error.stack}
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
