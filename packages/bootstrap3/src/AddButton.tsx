import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { joinClassNames, TranslatableString } from '@rjsf/utils';

import IconButton from './IconButton.tsx';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, className, onClick, disabled, registry, title, ...otherProps }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <div className='row'>
      <p
        className={joinClassNames(
          'col-xs-4 col-sm-2 col-lg-1 col-xs-offset-8 col-sm-offset-10 col-lg-offset-11 text-right',
          className,
        )}
      >
        <IconButton
          id={id}
          iconType='info'
          icon='plus'
          className='rjsf-btn-add col-xs-12'
          title={
            title
              ? translateString(TranslatableString.AddNamedButton, [title])
              : translateString(TranslatableString.AddItemButton)
          }
          onClick={onClick}
          disabled={disabled}
          registry={registry}
          {...otherProps}
        />
      </p>
    </div>
  );
}
