import { memo } from 'react';
import { faCopy, faArrowDown, faArrowUp, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

import DaisyUIButton from './DaisyUIButton';

function CopyButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <DaisyUIButton title={translateString(TranslatableString.CopyButton)} {...props} icon={faCopy} />;
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <DaisyUIButton title={translateString(TranslatableString.MoveDownButton)} {...props} icon={faArrowDown} />;
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

function MoveUpButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return <DaisyUIButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={faArrowUp} />;
}
export const MoveUpButton = memo(MoveUpButtonFn) as typeof MoveUpButtonFn;

function RemoveButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton
      title={translateString(TranslatableString.RemoveButton)}
      {...props}
      iconType='danger'
      icon={faTrash}
    />
  );
}
export const RemoveButton = memo(RemoveButtonFn) as typeof RemoveButtonFn;

function ClearButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton
      title={translateString(TranslatableString.ClearButton)}
      {...props}
      iconType='default'
      icon={faXmark}
    />
  );
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
