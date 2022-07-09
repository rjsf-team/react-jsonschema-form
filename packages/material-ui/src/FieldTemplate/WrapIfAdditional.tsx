import React from 'react';
import { ADDITIONAL_PROPERTY_FLAG, FieldTemplateProps } from '@rjsf/utils';

import { useMuiComponent } from '../MuiComponentContext';

type WrapIfAdditionalProps = { children: React.ReactElement; } &
  Pick<
    FieldTemplateProps,
    'classNames' | 'disabled' | 'id' | 'label' | 'onDropPropertyClick' | 'onKeyChange' | 'readonly' | 'required' | 'schema'
  >;

const WrapIfAdditional = ({
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
}: WrapIfAdditionalProps) => {
  const { Grid, FormControl, IconButton, InputLabel, Input, RemoveIcon } = useMuiComponent();
  const keyLabel = `${label} Key`; // i18n ?
  const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };

  if (!additional) {
    return <>{children}</>;
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) => onKeyChange(target.value);

  return (
    <Grid container={true} key={`${id}-key`} alignItems="center" spacing={2}>
      <Grid item={true} xs>
        <FormControl fullWidth={true} required={required}>
          <InputLabel>{keyLabel}</InputLabel>
          <Input
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type="text"
          />
        </FormControl>
      </Grid>
      <Grid item={true} xs>
        {children}
      </Grid>
      <Grid item={true}>
        <IconButton
          size="small"
          tabIndex={-1}
          style={btnStyle as any}
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
        >
          <RemoveIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default WrapIfAdditional;
