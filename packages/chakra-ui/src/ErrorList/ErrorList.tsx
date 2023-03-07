import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { List, ListIcon, ListItem, Alert, AlertTitle } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Alert flexDirection='column' alignItems='flex-start' gap={3} status='error'>
      <AlertTitle>{translateString(TranslatableString.ErrorsLabel)}</AlertTitle>
      <List>
        {errors.map((error, i) => (
          <ListItem key={i}>
            <ListIcon as={WarningIcon} color='red.500' />
            {error.stack}
          </ListItem>
        ))}
      </List>
    </Alert>
  );
}
