import type { FormContextType, MarkdownTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTestIds } from '@rjsf/utils';
import { Markdown } from 'markdown-to-jsx/react';

const TEST_IDS = getTestIds();

/** Renders markdown with raw HTML parsing disabled. Lives behind this subpath so the root entry never resolves
 * `markdown-to-jsx`, which is what lets it be an optional peer dependency.
 */
export default function MarkdownTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ children }: MarkdownTemplateProps<T, S, F>) {
  return (
    <Markdown options={{ disableParsingRawHTML: true }} data-testid={TEST_IDS.markdown}>
      {children}
    </Markdown>
  );
}

MarkdownTemplate.TEST_IDS = TEST_IDS;
