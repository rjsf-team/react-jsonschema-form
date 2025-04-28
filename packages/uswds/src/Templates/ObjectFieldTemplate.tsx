import { Fieldset } from '@trussworks/react-uswds';
import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';

/** The `ObjectFieldTemplate` is the template to use to render all the properties of an object field as identified by
 * the `SchemaField`. The properties are rendered using the `PropertyTemplate` template inside of a `Fieldset`.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    disabled,
    idSchema,
    onAddClick,
    properties,
    readonly,
    required,
    registry,
    schema,
    title,
    uiSchema,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  );
  const { AddButton } = registry.templates.ButtonTemplates;

  return (
    <Fieldset className="rjsf-uswds-object-fieldset">
      {title && (
        <TitleFieldTemplate
          id={`${idSchema.$id}-title`}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={`${idSchema.$id}-description`}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid container className="rjsf-uswds-object-properties">
        {properties.map((element, index) => (
          <Grid
            key={index}
            col={12}
            className={`rjsf-uswds-object-property ${element.hidden ? 'hidden' : ''}`}
          >
            {element.content}
          </Grid>
        ))}
        {onAddClick && schema.additionalProperties && (
          <Grid col={12} className="rjsf-uswds-object-add-button">
            <Grid col="auto">
              <AddButton
                className="object-property-expand"
                onClick={() => onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </Fieldset>
  );
}
