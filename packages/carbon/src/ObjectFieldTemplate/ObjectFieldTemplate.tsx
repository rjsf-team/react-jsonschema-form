// @ts-expect-error there's no type definition for Stack
import { Button, Stack } from '@carbon/react';
import {
  canExpand,
  descriptionId,
  FormContextType,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
  TranslatableString,
} from '@rjsf/utils';
import { useCarbonOptions, useNestDepth } from '../contexts';
import { Layer } from '../components/Layer';
import { Add } from '@carbon/icons-react';

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const carbonOptions = useCarbonOptions();
  const nestDepth = useNestDepth();
  const { translateString } = registry;
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  // const {
  //   ButtonTemplates: { AddButton },
  // } = registry.templates;

  return (
    <>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div
        style={
          nestDepth
            ? {
                padding: '8px 16px',
                backgroundColor: 'var(--cds-layer)',
              }
            : {}
        }
      >
        <Stack gap={carbonOptions.stackGap}>
          <Layer>
            <Stack gap={carbonOptions.stackGap}>
              {
                // add a line of comment to dismiss type error:
                // Expression produces a union type that is too complex to represent.ts(2590)
                properties.map((item) => item.content)
              }
            </Stack>
          </Layer>
          {canExpand(schema, uiSchema, formData) && (
            <Button
              size='sm'
              kind='tertiary'
              renderIcon={Add}
              disabled={disabled || readonly}
              onClick={onAddClick(schema)}
              uiSchema={uiSchema}
              registry={registry}
            >
              {translateString(TranslatableString.AddItemButton)}
            </Button>
          )}
        </Stack>
      </div>
    </>
  );
}
