import { ListItem, ListRoot } from '@chakra-ui/react';
import type { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

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
          // oxlint-disable-next-line react/no-array-index-key
          <ListItem key={i}>{error.stack}</ListItem>
        ))}
      </ListRoot>
    </Alert>
  );
}
