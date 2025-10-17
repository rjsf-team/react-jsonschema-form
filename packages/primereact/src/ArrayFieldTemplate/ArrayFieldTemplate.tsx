import {
  getTemplate,
  getUiOptions,
  isFixedItems,
  ArrayFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  buttonId,
} from '@rjsf/utils';
import { Fieldset } from 'primereact/fieldset';
import AddButton from '../AddButton';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateProps` props for the component
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
    disabled,
    items,
    optionalDataControl,
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
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;

  return (
    <>
      <ArrayFieldTitleTemplate
        fieldPathId={fieldPathId}
        title={uiOptions.title || title}
        schema={schema}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
        optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
      />
      <Fieldset
        {...rest}
        id={fieldPathId.$id}
        className={`${className}${isFixedItems<S>(schema) ? '' : ' sortable-form-fields'}`}
      >
        <ArrayFieldDescriptionTemplate
          fieldPathId={fieldPathId}
          description={uiOptions.description || schema.description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
        <div key={`array-item-list-${fieldPathId.$id}`}>
          <div>
            {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
            {items}
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
      </Fieldset>
    </>
  );
}
