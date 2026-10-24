import type { FormControlProps } from '@mui/material/FormControl';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import type { TypographyProps } from '@mui/material/Typography';
import Typography from '@mui/material/Typography';
import type { FieldTemplateProps, FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  hasTemplateErrors,
  templateDrawsDescription,
  templateDrawsLabel,
  templateDrawsPlannedLabel,
  templateLabelFor,
  templateMarksRequired,
} from '@rjsf/utils';

import { getMuiProps } from '../util.ts';

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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    presentation,
    hidden,
    label,
    keyName,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    readonly,
    required,
    errors,
    help,
    description,
    rawDescription,
    schema,
    uiSchema,
    registry,
  } = props;
  const displayLabel = templateDrawsLabel<T, S, F>(props);
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const hasError = hasTemplateErrors<T, S, F>(props);
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  // The plan's description already says whether a checkbox draws its own; the guess by the `checkbox` alias is left
  // for a template rendered without one, so a description the plan gives the template isn't dropped
  const leavesPartsToCheckbox = !presentation && uiOptions.widget === 'checkbox';
  const drawsLabel = templateDrawsPlannedLabel<T, S, F>(props);

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, FieldTemplateMuiProps>(uiOptions);

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      keyName={keyName}
      // oxlint-disable-next-line typescript/no-deprecated -- handed on to a `WrapIfAdditionalTemplate` rendered without a plan, which labels the key by it
      displayLabel={displayLabel}
      presentation={presentation}
      rawDescription={rawDescription}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      propertyNamesEnum={propertyNamesEnum}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <FormControl
        fullWidth
        error={hasError}
        required={required}
        {...muiSlotProps?.fieldFormControl}
        sx={otherMuiProps.sx}
        className={otherMuiProps.className}
      >
        {drawsLabel && (
          <FormLabel
            id={presentation?.label.id}
            htmlFor={templateLabelFor<T, S, F>(props)}
            required={templateMarksRequired<T, S, F>(props)}
          >
            {label}
          </FormLabel>
        )}
        {children}
        {!leavesPartsToCheckbox && templateDrawsDescription<T, S, F>(props) && rawDescription ? (
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
