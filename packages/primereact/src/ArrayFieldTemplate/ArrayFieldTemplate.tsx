import {
  getTemplate,
  getUiOptions,
  isFixedItems,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UI_OPTIONS_KEY,
} from '@rjsf/utils';
import { Fieldset } from 'primereact/fieldset';
import AddButton from '../AddButton';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    uiSchema,
    idSchema,
    canAdd,
    className,
    disabled,
    items,
    onAddClick,
    readonly,
    schema,
    title,
    registry,
    required,
    ...rest
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

  return (
    <>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        schema={schema}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      <Fieldset {...rest} className={`${className} ${isFixedItems<S>(schema) ? '' : 'sortable-form-fields'}`}>
        <ArrayFieldDescriptionTemplate
          idSchema={idSchema}
          description={uiOptions.description || schema.description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
        <div key={`array-item-list-${idSchema.$id}`}>
          <div>
            {items &&
              items.map(({ key, uiSchema: itemUiSchema = {}, ...props }: ArrayFieldTemplateItemType<T, S, F>) => {
                const mergedUiSchema = {
                  ...itemUiSchema,
                  [UI_OPTIONS_KEY]: {
                    ...itemUiSchema[UI_OPTIONS_KEY],
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
                className='array-item-add'
                onClick={onAddClick}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </div>
          )}
        </div>
      </Fieldset>
    </>
  );
}
