import type { ReactElement } from 'react';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { getTemplate, getUiOptions } from '@rjsf/utils';

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
>({ description, registry, uiSchema = {} }: RichDescriptionProps<T, S, F>) {
  if (typeof description !== 'string') {
    return description;
  }
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  if (!uiOptions.enableMarkdownInDescription) {
    return description;
  }
  const MarkdownTemplate = getTemplate<'MarkdownTemplate', T, S, F>('MarkdownTemplate', registry, uiOptions);
  return (
    <MarkdownTemplate registry={registry} uiSchema={uiSchema}>
      {description}
    </MarkdownTemplate>
  );
}
