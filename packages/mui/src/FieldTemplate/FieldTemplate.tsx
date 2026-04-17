import FormControl, { FormControlProps } from '@mui/material/FormControl';
import Typography, { TypographyProps } from '@mui/material/Typography';
import {
  FieldTemplateProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the FieldTemplate. */
export interface FieldTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the FieldTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the MUI `FormControl` wrapping the field. */
    fieldFormControl?: FormControlProps;
    /** Props applied to the MUI `Typography` element used for description. */
    fieldTypography?: TypographyProps;
  };
}

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
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
    uiOptions,
  );

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  const isCheckbox = uiOptions.widget === 'checkbox';

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, FieldTemplateMuiProps>(uiOptions);

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      displayLabel={displayLabel}
      rawDescription={rawDescription}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <FormControl
        fullWidth={true}
        error={rawErrors.length ? true : false}
        required={required}
        {...muiSlotProps?.fieldFormControl}
        sx={otherMuiProps.sx}
        className={otherMuiProps.className}
      >
        {children}
        {displayLabel && !isCheckbox && rawDescription ? (
          <Typography variant='caption' color='textSecondary' {...muiSlotProps?.fieldTypography}>
            {description}
          </Typography>
        ) : null}
        {errors}
        {help}
      </FormControl>
    </WrapIfAdditionalTemplate>
  );
}
