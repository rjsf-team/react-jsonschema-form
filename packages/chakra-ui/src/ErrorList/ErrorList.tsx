import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { ListItem, ListRoot } from '@chakra-ui/react';

import { Alert } from '../components/ui/alert';

export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Alert status='error' title={translateString(TranslatableString.ErrorsLabel)} mb={3}>
      <ListRoot listStylePosition='inside'>
        {errors.map((error, i) => (
          <ListItem key={i}>{error.stack}</ListItem>
        ))}
      </ListRoot>
    </Alert>
  );
}
