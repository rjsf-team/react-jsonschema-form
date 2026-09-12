import type { ReactElement } from 'react';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { getTemplate, getUiOptions } from '@rjsf/utils';

export interface RichHelpProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  /** The help text for a field, potentially containing markdown */
  help: string | ReactElement;
  /** The uiSchema object for this base component */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
}

/** Renders help with the registered renderer when its markdown option is enabled. */
export default function RichHelp<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  help,
  registry,
  uiSchema = {},
}: RichHelpProps<T, S, F>) {
  if (typeof help !== 'string') {
    return help;
  }
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  if (!uiOptions.enableMarkdownInHelp) {
    return help;
  }
  const MarkdownTemplate = getTemplate<'MarkdownTemplate', T, S, F>('MarkdownTemplate', registry, uiOptions);
  return (
    <MarkdownTemplate registry={registry} uiSchema={uiSchema}>
      {help}
    </MarkdownTemplate>
  );
}
