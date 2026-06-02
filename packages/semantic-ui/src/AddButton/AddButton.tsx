import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import type { ButtonProps } from 'semantic-ui-react';
import { Button, Icon } from 'semantic-ui-react';

import type { SemanticIconButtonProps } from '../IconButton';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  color,
  ...props
}: SemanticIconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button
      title={translateString(TranslatableString.AddItemButton)}
      color={color as ButtonProps['color']}
      size='tiny'
      {...props}
      icon
    >
      <Icon name='plus' />
    </Button>
  );
}
