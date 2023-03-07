import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import IconButton from './IconButton';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  className,
  onClick,
  disabled,
  registry,
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <div className='row'>
      <p className={`col-xs-3 col-xs-offset-9 text-right ${className}`}>
        <IconButton
          iconType='info'
          icon='plus'
          className='btn-add col-xs-12'
          title={translateString(TranslatableString.AddButton)}
          onClick={onClick}
          disabled={disabled}
          registry={registry}
        />
      </p>
    </div>
  );
}
