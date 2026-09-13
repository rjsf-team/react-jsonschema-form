import type { ReactElement } from 'react';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { getTemplate, getUiOptions } from '@rjsf/utils';

export interface RichTextProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  /** The text to render, potentially containing markdown */
  text: string | ReactElement;
  /** The `ui:options` flag that enables markdown for this kind of text */
  enabledBy: 'enableMarkdownInDescription' | 'enableMarkdownInHelp';
  /** The uiSchema object for this base component */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
}

/** Renders a string `text` through the registered `MarkdownTemplate` when the `enabledBy` option is on; a React
 * element is rendered as-is. Shared by `RichDescription` and `RichHelp` so the gating logic lives in one place.
 *
 * @param props - The `RichTextProps` for this component
 */
export default function RichText<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  text,
  enabledBy,
  registry,
  uiSchema = {},
}: RichTextProps<T, S, F>) {
  if (typeof text !== 'string') {
    return text;
  }
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  if (!uiOptions[enabledBy]) {
    return text;
  }
  const MarkdownTemplate = getTemplate<'MarkdownTemplate', T, S, F>('MarkdownTemplate', registry, uiOptions);
  return (
    <MarkdownTemplate registry={registry} uiSchema={uiSchema}>
      {text}
    </MarkdownTemplate>
  );
}
