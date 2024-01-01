import FormControl from '@mui/joy/FormControl';
import Typography from '@mui/joy/Typography';
import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';
import { useMemo } from 'react';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    hidden,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    rawErrors = [],
    errors,
    help,
    description,
    rawDescription,
    schema,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );

  const isCheckboxOrRadio = useMemo(() => {
    let widget = (uiSchema?.['ui:widget'] ?? '') as string;
    widget = widget.toLowerCase();
    const toReturn = widget.includes('checkbox') || widget.includes('radio');
    return toReturn;
  }, [uiSchema]);

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      {isCheckboxOrRadio ? (
        <>
          {children}
          {displayLabel && rawDescription ? (
            <Typography level='body-md' color='neutral'>
              {description}
            </Typography>
          ) : null}
          {errors}
          {help}
        </>
      ) : (
        <FormControl error={rawErrors.length ? true : false} required={required}>
          {children}
          {displayLabel && rawDescription ? (
            <Typography level='body-md' color='neutral'>
              {description}
            </Typography>
          ) : null}
          {errors}
          {help}
        </FormControl>
      )}
    </WrapIfAdditionalTemplate>
  );
}
