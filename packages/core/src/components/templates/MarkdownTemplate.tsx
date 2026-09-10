import type { MarkdownTemplateProps } from '@rjsf/utils';

/** The default `MarkdownTemplate` renders the text as-is, so that no markdown library is bundled unless an application
 * registers the one from `@rjsf/core/markdown` (or its own) instead.
 */
export default function MarkdownTemplate({ children }: MarkdownTemplateProps) {
  return children;
}
