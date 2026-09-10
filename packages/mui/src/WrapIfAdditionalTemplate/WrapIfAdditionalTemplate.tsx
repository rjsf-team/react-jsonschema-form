import type { CSSProperties } from 'react';
import { useCallback } from 'react';
import type { GridProps } from '@mui/material/Grid';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type {
  GenericObjectType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, buttonId, TranslatableString, getUiOptions, getWidget } from '@rjsf/utils';

import { computeSxProps, getMuiProps } from '../util.ts';
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
    propertyNamesEnum,
  } = props;
  const { templates, translateString, widgets } = registry;
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

  // Use SelectWidget when propertyNamesEnum is available
  const SelectWidget = propertyNamesEnum && propertyNamesEnum.length > 0 ? getWidget(widgets, 'SelectWidget') : null;
  const enumOptions = propertyNamesEnum?.map((value) => ({ value, label: String(value) })) ?? [];

  // Handle onBlur for SelectWidget which expects (id: string, value: any) => void
  // but onKeyRenameBlur expects (event: FocusEvent<HTMLInputElement>) => void
  const handleSelectBlur = useCallback(
    (_id: string, value: any) => {
      onKeyRenameBlur({ target: { value } } as any);
    },
    [onKeyRenameBlur],
  );

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { rjsfSlotProps: { wrapGridContainer, wrapKeyGridItem, wrapChildrenGridItem, wrapRemoveButtonGridItem } = {} } =
    getMuiProps<T, S, F, WrapIfAdditionalTemplateMuiProps>(uiOptions);

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  return (
    <Grid
      container
      key={`${id}-key`}
      spacing={2}
      className={classNames}
      style={style}
      {...wrapGridContainer}
      sx={computeSxProps<GridProps>({ alignItems: 'flex-start' }, wrapGridContainer)}
    >
      <Grid size={5.5} {...wrapKeyGridItem}>
        {SelectWidget ? (
          <SelectWidget
            key={label}
            id={`${id}-key`}
            name={`${id}-key`}
            value={label}
            required={required}
            disabled={disabled || readonly}
            readonly={readonly}
            options={{
              enumOptions,
              enumDisabled: [],
            }}
            onBlur={handleSelectBlur}
            onFocus={handleSelectBlur}
            onChange={(value) => {
              onKeyRenameBlur({ target: { value } } as any);
            }}
            schema={{ type: 'string', enum: propertyNamesEnum }}
            as
            any
            registry={registry as any}
            uiSchema={uiSchema as any}
            label={keyLabel}
          />
        ) : (
          <TextField
            key={label}
            fullWidth
            required={required}
            label={displayLabel ? keyLabel : undefined}
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? onKeyRenameBlur : undefined}
            type='text'
          />
        )}
      </Grid>
      <Grid size={5.5} {...wrapChildrenGridItem}>
        {children}
      </Grid>
      <Grid {...wrapRemoveButtonGridItem} sx={computeSxProps<GridProps>({ mt: 1.5 }, wrapRemoveButtonGridItem)}>
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
