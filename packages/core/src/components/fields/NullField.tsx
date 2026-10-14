import { useEffect } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';

/** The `NullField` component is used to render a field in the schema is null. It also ensures that the `formData` is
 * also set to null if it has no value. It has no control for a label to name, so it draws its own title and
 * description, as an object draws its heading, where its plan says it does.
 *
 * @param props - The `FieldProps` for this template
 */
function NullField<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: FieldProps<T, S, F>,
) {
  const { formData, onChange, fieldPath, schema, uiSchema, registry, required, presentation } = props;
  useEffect(() => {
    if (formData === undefined) {
      onChange(null as unknown as T, fieldPath);
    }
  }, [fieldPath, formData, onChange]);

  if (!presentation) {
    return null;
  }
  const { label, description } = presentation;
  const drawsLabel = label.by === 'self' && Boolean(label.text);
  const drawsDescription = description.by === 'self';
  if (!drawsLabel && !drawsDescription) {
    return null;
  }
  const { TitleFieldTemplate, DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, getUiOptions(uiSchema));
  return (
    <>
      {drawsLabel && (
        <TitleFieldTemplate
          id={label.id}
          title={label.text}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {drawsDescription && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );
}

export default NullField;
