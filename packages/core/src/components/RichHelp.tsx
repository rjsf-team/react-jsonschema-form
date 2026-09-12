import type { ReactElement } from 'react';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';

import RichText from './RichText.tsx';

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
  uiSchema,
}: RichHelpProps<T, S, F>) {
  return <RichText<T, S, F> text={help} enabledBy='enableMarkdownInHelp' registry={registry} uiSchema={uiSchema} />;
}
