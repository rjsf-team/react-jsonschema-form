import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, description, uiSchema }: DescriptionFieldProps<T, S, F>) {
  if (!description) {
    return null;
  }

  // For markdown rendering, check ui:options
  const markdownEnabled =
    uiSchema?.['ui:options']?.enableMarkdown ||
    uiSchema?.['ui:options']?.enableMarkdownInDescription !== false;

  // Simple implementation - if markdown support is needed, consider adding react-markdown as a dependency
  return (
    <div id={id} className="usa-hint">
      {typeof description === 'string' && markdownEnabled ? (
        // Basic implementation for markdown-enabled text
        <div dangerouslySetInnerHTML={{ __html: description }} />
      ) : (
        // Regular text
        description
      )}
    </div>
  );
}
