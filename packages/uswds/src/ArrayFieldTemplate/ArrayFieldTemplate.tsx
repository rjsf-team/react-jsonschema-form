import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  FieldId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  IdSchema,
  UiSchema,
  Registry,
} from '@rjsf/utils';
import { Fieldset, Grid, GridContainer } from '@trussworks/react-uswds';

export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    className,
    disabled,
    idSchema,
    items,
    onAddClick,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions
  );
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const fieldsetProps = {
    className: className,
    id: idSchema.$id,
  };

  return (
    <Fieldset {...fieldsetProps}>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        schema={schema}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      <ArrayFieldDescriptionTemplate
        idSchema={idSchema}
        description={uiOptions.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <div className="rjsf-array-items-list">
        {items &&
          items.map(({ key, ...itemProps }) => (
            <ArrayFieldItemTemplate key={key} {...itemProps} />
          ))}
      </div>

      {canAdd && (
        <GridContainer className="margin-top-1">
          <Grid row>
            <Grid col="auto">
              <AddButton
                className="array-item-add"
                onClick={onAddClick}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid>
          </Grid>
        </GridContainer>
      )}
    </Fieldset>
  );
}
