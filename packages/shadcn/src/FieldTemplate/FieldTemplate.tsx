import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplate, getUiOptions, getVisibleErrors } from '@rjsf/utils';

import { cn } from '../lib/utils.ts';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  children,
  displayLabel,
  rawErrors,
  hideError,
  errors,
  help,
  description,
  rawDescription,
  classNames,
  style,
  disabled,
  label,
  keyName,
  hidden,
  onKeyRename,
  onKeyRenameBlur,
  onRemoveProperty,
  propertyNamesEnum,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: FieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions(uiSchema);
  const hasError = getVisibleErrors({ rawErrors, hideError }).length > 0;
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions,
  );
  if (hidden) {
    return <div className='hidden'>{children}</div>;
  }
  const isCheckbox = uiOptions.widget === 'checkbox';
  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      keyName={keyName}
      displayLabel={displayLabel}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      propertyNamesEnum={propertyNamesEnum}
      rawDescription={rawDescription}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <div className='flex flex-col gap-2'>
        {displayLabel && !isCheckbox && (
          <label
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              { ' text-destructive': hasError },
            )}
            htmlFor={id}
          >
            {label}
            {required ? '*' : null}
          </label>
        )}
        {children}
        {displayLabel && rawDescription && !isCheckbox && (
          <span className={cn('text-xs font-medium text-muted-foreground', { ' text-destructive': hasError })}>
            {description}
          </span>
        )}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}
