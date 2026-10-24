import type { CSSProperties, ReactNode } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';

const GROUP_ONLY_FIELDSET_STYLE: CSSProperties = { border: 0, margin: 0, padding: 0, minWidth: 0 };

/** Draws the title and description a field's plan gives the field itself, for a field with no control for a label to
 * name, as `NullField` and the unsupported-field box `FallbackField` or an array with no `items` renders are
 *
 * @param props - The field's `schema`, `uiSchema`, `registry` and `presentation`, and the `children` the title heads
 */
export default function OwnTitleAndDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema' | 'registry' | 'presentation'> & { children?: ReactNode }) {
  const { schema, uiSchema, registry, presentation, children } = props;
  if (!presentation) {
    return <>{children}</>;
  }
  const { label, description } = presentation;
  const drawsLabel = label.by === 'self' && Boolean(label.text);
  const drawsDescription = description.by === 'self';
  if (!drawsLabel && !drawsDescription) {
    return <>{children}</>;
  }
  const { TitleFieldTemplate, DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, getUiOptions(uiSchema));
  // A `TitleFieldTemplate` may draw a `<legend>`, as core's does, which is valid only as the first child of a
  // `<fieldset>` it names, so a title is drawn inside one with the content it heads, as an object's heading and
  // properties are. The fieldset is only there for the group, so it draws none of the border and spacing a browser
  // gives one, which not every theme resets
  if (!drawsLabel) {
    return (
      <>
        {drawsDescription && (
          <DescriptionFieldTemplate
            id={description.id}
            description={description.text}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        )}
        {children}
      </>
    );
  }
  return (
    <fieldset style={GROUP_ONLY_FIELDSET_STYLE}>
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
      {children}
    </fieldset>
  );
}
