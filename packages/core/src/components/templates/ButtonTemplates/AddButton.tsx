import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { clsx } from 'clsx';

import IconButton from './IconButton.tsx';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, className, onClick, disabled, registry }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <IconButton
      id={id}
      iconType='info'
      icon='plus'
      className={clsx('rjsf-btn-add', className)}
      title={translateString(TranslatableString.AddButton)}
      onClick={onClick}
      disabled={disabled}
      registry={registry}
    />
  );
}
