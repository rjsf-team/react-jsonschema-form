import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions, hasVisibleErrors } from '@rjsf/utils';

import { cn } from '../lib/utils.ts';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  children,
  displayLabel,
  presentation,
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
  const hasError = hasVisibleErrors({ rawErrors, hideError });
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  if (hidden) {
    return <div className='hidden'>{children}</div>;
  }
  // The plan's `displayLabel` and description already say what a checkbox draws itself; the guess by the `checkbox`
  // alias is left for a template rendered without one, so a part the plan gives the template isn't dropped
  const leavesPartsToCheckbox = !presentation && uiOptions.widget === 'checkbox';
  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      keyName={keyName}
      displayLabel={displayLabel}
      presentation={presentation}
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
        {displayLabel && !leavesPartsToCheckbox && (
          <label
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              { ' text-destructive': hasError },
            )}
            htmlFor={id}
            id={presentation?.label.id}
          >
            {label}
            {required ? '*' : null}
          </label>
        )}
        {children}
        {rawDescription && !leavesPartsToCheckbox && (
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
