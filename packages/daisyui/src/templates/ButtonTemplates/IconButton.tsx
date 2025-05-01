import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { faCopy, faArrowDown, faArrowUp, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import DaisyUIButton from './DaisyUIButton';

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <DaisyUIButton {...props} title={translateString(TranslatableString.CopyButton)} icon={faCopy as IconDefinition} />
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
      {...props}
      title={translateString(TranslatableString.MoveDownButton)}
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
      {...props}
      title={translateString(TranslatableString.MoveUpButton)}
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
      {...props}
      title={translateString(TranslatableString.RemoveButton)}
      iconType='danger'
      icon={faTrash as IconDefinition}
    />
  );
}
