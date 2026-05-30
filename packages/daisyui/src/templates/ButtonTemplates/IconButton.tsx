import { memo } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCopy, faArrowDown, faArrowUp, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import DaisyUIButton from './DaisyUIButton';

function CopyButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton title={translateString(TranslatableString.CopyButton)} {...props} icon={faCopy as IconDefinition} />
  );
}
export const CopyButton = memo(CopyButtonFn) as typeof CopyButtonFn;

function MoveDownButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={faArrowDown as IconDefinition}
    />
  );
}
export const MoveDownButton = memo(MoveDownButtonFn) as typeof MoveDownButtonFn;

function MoveUpButtonFn<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      icon={faArrowUp as IconDefinition}
    />
  );
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
      icon={faTrash as IconDefinition}
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
      icon={faXmark as IconDefinition}
    />
  );
}
export const ClearButton = memo(ClearButtonFn) as typeof ClearButtonFn;
