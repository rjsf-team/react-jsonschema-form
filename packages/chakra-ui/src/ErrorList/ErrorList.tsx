import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { ListIndicator, ListItem, ListRoot } from '@chakra-ui/react';
import { TriangleAlert } from 'lucide-react';

import { Alert } from '../components/ui/alert';

export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Alert
      flexDirection='column'
      alignItems='flex-start'
      gap={3}
      status='error'
      title={translateString(TranslatableString.ErrorsLabel)}
    >
      <ListRoot>
        {errors.map((error, i) => (
          <ListItem key={i}>
            <ListIndicator asChild color='red.500'>
              <TriangleAlert />
            </ListIndicator>
            {error.stack}
          </ListItem>
        ))}
      </ListRoot>
    </Alert>
  );
}
