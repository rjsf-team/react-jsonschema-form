import { CSSProperties } from 'react';
import Grid, { GridProps } from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import {
  ADDITIONAL_PROPERTY_FLAG,
  GenericObjectType,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';
/** Properties available for the `rjsfSlotProps` target of the WrapIfAdditionalTemplate. */
export interface WrapIfAdditionalTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the WrapIfAdditionalTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the outermost `Grid` container. */
    wrapGridContainer?: GridProps;
    /** Props applied to the `Grid` item containing the key TextField. */
    wrapKeyGridItem?: GridProps;
    /** Props applied to the `Grid` item containing the field children. */
    wrapChildrenGridItem?: GridProps;
    /** Props applied to the `Grid` item containing the remove button. */
    wrapRemoveButtonGridItem?: GridProps;
  };
}

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
    disabled,
    id,
    label,
    displayLabel,
    onKeyRenameBlur,
    onRemoveProperty,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { rjsfSlotProps } = getMuiProps<T, S, F, WrapIfAdditionalTemplateMuiProps>(uiOptions);
  const muiSlotProps = rjsfSlotProps;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const { wrapGridContainer, wrapKeyGridItem, wrapChildrenGridItem, wrapRemoveButtonGridItem } = muiSlotProps || {};

  return (
    <Grid
      container
      key={`${id}-key`}
      alignItems='flex-start'
      spacing={2}
      className={classNames}
      style={style}
      {...wrapGridContainer}
    >
      <Grid size={5.5} {...wrapKeyGridItem}>
        <TextField
          key={label}
          fullWidth={true}
          required={required}
          label={displayLabel ? keyLabel : undefined}
          defaultValue={label}
          disabled={disabled || readonly}
          id={`${id}-key`}
          name={`${id}-key`}
          onBlur={!readonly ? onKeyRenameBlur : undefined}
          type='text'
        />
      </Grid>
      <Grid size={5.5} {...wrapChildrenGridItem}>
        {children}
      </Grid>
      <Grid sx={{ mt: 1.5 }} {...wrapRemoveButtonGridItem}>
        <RemoveButton
          id={buttonId(id, 'remove')}
          className='rjsf-object-property-remove'
          iconType='default'
          style={btnStyle}
          disabled={disabled || readonly}
          onClick={onRemoveProperty}
          uiSchema={uiSchema}
          registry={registry}
        />
      </Grid>
    </Grid>
  );
}
