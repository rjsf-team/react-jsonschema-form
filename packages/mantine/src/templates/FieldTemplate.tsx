import { Box, Input } from '@mantine/core';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  templateDrawsPlannedLabel,
  templateLabelFor,
  templateMarksRequired,
} from '@rjsf/utils';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    classNames,
    style,
    label,
    errors,
    help,
    description,
    rawDescription,
    hidden,
    schema,
    uiSchema,
    registry,
    presentation,
    children,
    ...otherProps
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);

  if (hidden) {
    return <Box display='none'>{children}</Box>;
  }

  const drawsLabel = templateDrawsPlannedLabel<T, S, F>(props);
  return (
    <WrapIfAdditionalTemplate
      id={id}
      classNames={classNames}
      style={style}
      label={label}
      rawDescription={rawDescription}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      presentation={presentation}
      {...otherProps}
    >
      {drawsLabel && (
        <Input.Label
          id={presentation?.label.id}
          htmlFor={templateLabelFor<T, S, F>(props)}
          required={templateMarksRequired<T, S, F>(props)}
        >
          {label}
        </Input.Label>
      )}
      {/* Only under a plan, as for a widget declared to leave its description to the template: without one, nothing says
          whether this theme's widgets, which draw their own, leave it to the template */}
      {presentation && description && <Input.Description component='div'>{description}</Input.Description>}
      {children}
      {errors}
      {help}
    </WrapIfAdditionalTemplate>
  );
}
