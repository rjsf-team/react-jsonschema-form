import type { ReactElement } from 'react';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';

import RichText from './RichText.tsx';

export interface RichDescriptionProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> {
  /** The description text for a field, potentially containing markdown */
  description: string | ReactElement;
  /** The uiSchema object for this base component */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
}

/** Renders a string `description` through the registered `MarkdownTemplate`; a React element is rendered as-is
 *
 * @param props - The `RichDescriptionProps` for this component
 */
export default function RichDescription<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ description, registry, uiSchema }: RichDescriptionProps<T, S, F>) {
  return (
    <RichText<T, S, F>
      text={description}
      enabledBy='enableMarkdownInDescription'
      registry={registry}
      uiSchema={uiSchema}
    />
  );
}
