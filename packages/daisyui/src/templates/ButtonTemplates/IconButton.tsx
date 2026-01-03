import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { faCopy, faArrowDown, faArrowUp, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import DaisyUIButton from './DaisyUIButton';

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton title={translateString(TranslatableString.CopyButton)} {...props} icon={faCopy as IconDefinition} />
  );
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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

export function ClearButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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
