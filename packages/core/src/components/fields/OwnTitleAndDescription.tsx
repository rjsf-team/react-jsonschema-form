import { Fragment } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';

/** Draws the title and description a field's plan gives the field itself, for a field with no control for a label to
 * name, as `NullField` and the unsupported-field box `FallbackField` or an array with no `items` renders are
 *
 * @param props - The field's `schema`, `uiSchema`, `registry` and `presentation`
 */
export default function OwnTitleAndDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema' | 'registry' | 'presentation'>) {
  const { schema, uiSchema, registry, presentation } = props;
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
  // A `TitleFieldTemplate` may draw a `<legend>`, as core's does, which is valid only as the first child of a
  // `<fieldset>` it names, so a title is drawn inside one, as an object's heading and description are
  const Wrapper = drawsLabel ? 'fieldset' : Fragment;
  return (
    <Wrapper>
      {drawsLabel && (
        <TitleFieldTemplate
          id={label.id}
          title={label.text}
          required={label.requiredMarker}
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
    </Wrapper>
  );
}
