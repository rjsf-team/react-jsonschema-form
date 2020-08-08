import React from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import RemoveIcon from '@material-ui/icons/Remove';

import { utils } from '@rjsf/core';
const { ADDITIONAL_PROPERTY_FLAG } = utils;

import { FieldTemplateProps } from '@rjsf/core';

const WrapIfAdditional = ({
	children,
	classNames,
	disabled,
	id,
	label,
	onDropPropertyClick,
	onKeyChange,
	readonly,
	required,
	schema
}: FieldTemplateProps) => {
	const keyLabel = `${label} Key`; // i18n ?
	const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);

	if (!additional) {
		return <>{children}</>;
	}

	const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => onKeyChange(e.currentTarget.value);

	return (
		<div className={classNames}>
			<Grid container spacing={2}>
				<Grid item xs>
					<TextField
						id={`${id}-key`}
						name={`${id}-key`}
						disabled={disabled || readonly}
						label={keyLabel}
						required={required}
						defaultValue={label}
						inputProps={{ onBlur: handleBlur }}
					/>
				</Grid>
				<Grid item xs={6}>
					{children}
				</Grid>
				<Grid item xs>
					<Button
						variant="outlined"
						color="secondary"
						disabled={disabled || readonly}
						onClick={onDropPropertyClick(label)}
					>
						<RemoveIcon />
					</Button>
				</Grid>
			</Grid>
		</div>
	);
};

export default WrapIfAdditional;
