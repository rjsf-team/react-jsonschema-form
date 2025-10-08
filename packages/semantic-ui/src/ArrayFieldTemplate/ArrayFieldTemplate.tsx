import {
  getTemplate,
  getUiOptions,
  isFixedItems,
  ArrayFieldTemplateProps,
  ArrayFieldItemTemplateType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UI_OPTIONS_KEY,
  buttonId,
} from '@rjsf/utils';

import { cleanClassNames, getSemanticProps } from '../util';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    uiSchema,
    fieldPathId,
    canAdd,
    className,
    // classNames, This is not part of the type, so it is likely never passed in
    disabled,
    items,
    optionalDataControl,
    onAddClick,
    // options, This is not part of the type, so it is likely never passed in
    readonly,
    required,
    schema,
    title,
    registry,
  } = props;
  const semanticProps = getSemanticProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    defaultSchemaProps: { horizontalButtons: true, wrapItem: false },
  });
  const { horizontalButtons, wrapItem } = semanticProps;
  const semantic = { horizontalButtons, wrapItem };
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <div className={cleanClassNames([className, isFixedItems<S>(schema) ? '' : 'sortable-form-fields'])}>
      <ArrayFieldTitleTemplate
        fieldPathId={fieldPathId}
        title={uiOptions.title || title}
        schema={schema}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
        optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
      />
      <ArrayFieldDescriptionTemplate
        fieldPathId={fieldPathId}
        description={uiOptions.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <div key={`array-item-list-${fieldPathId.$id}`}>
        <div className='row array-item-list'>
          {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
          {items.map(({ key, uiSchema: itemUiSchema = {}, ...props }: ArrayFieldItemTemplateType<T, S, F>) => {
            // Merge in the semantic props from the ArrayFieldTemplate into each of the items
            const mergedUiSchema = {
              ...itemUiSchema,
              [UI_OPTIONS_KEY]: {
                ...itemUiSchema[UI_OPTIONS_KEY],
                semantic,
              },
            };
            return <ArrayFieldItemTemplate key={key} {...props} uiSchema={mergedUiSchema} />;
          })}
        </div>
        {canAdd && (
          <div
            style={{
              marginTop: '1rem',
              position: 'relative',
              textAlign: 'right',
            }}
          >
            <AddButton
              id={buttonId(fieldPathId, 'add')}
              className='rjsf-array-item-add'
              onClick={onAddClick}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </div>
        )}
      </div>
    </div>
  );
}
