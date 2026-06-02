import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowDown, faArrowUp, faCopy, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

import DaisyUIButton from './DaisyUIButton';

library.add(faPlus, faCopy, faArrowDown, faArrowUp, faTrash);

/** The `AddButton` renders a button that represent the `Add` action on a form
 *
 * @param props - The props for the component
 */
export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  className,
  onClick,
  disabled,
  registry,
  ...otherProps
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <div className='row'>
      <p className={`col-xs-3 col-xs-offset-9 text-right ${className}`}>
        <DaisyUIButton
          title={translateString(TranslatableString.AddButton)}
          {...otherProps}
          iconType='info'
          icon={faPlus}
          className='btn-add col-xs-12 btn-primary btn-primary-content'
          onClick={onClick}
          disabled={disabled}
          registry={registry}
        />
      </p>
    </div>
  );
}
