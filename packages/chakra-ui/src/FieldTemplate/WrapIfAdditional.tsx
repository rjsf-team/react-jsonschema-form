import React from "react";

import { utils } from "@rjsf/core";
import { JSONSchema7 } from "json-schema";

import {
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Input,
} from "@chakra-ui/react";

import IconButton from "../IconButton";

const { ADDITIONAL_PROPERTY_FLAG } = utils;

type WrapIfAdditionalProps = {
  children: React.ReactElement;
  classNames: string;
  disabled: boolean;
  id: string;
  label: string;
  onDropPropertyClick: (index: string) => (event?: any) => void;
  onKeyChange: (index: string) => (event?: any) => void;
  readonly: boolean;
  required: boolean;
  schema: JSONSchema7;
};

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
  const keyLabel = `${label} Key`; // i18n ?
  const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);
  // const btnStyle = {
  //   flex: 1,
  //   paddingLeft: 6,
  //   paddingRight: 6,
  //   fontWeight: "bold",
  // };

  if (!additional) {
    return <>{children}</>;
  }

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onKeyChange(target.value);

  return (
    <Grid key={`${id}-key`} alignItems="center" gap={2}>
      <GridItem>
        <FormControl isRequired={required}>
          <FormLabel htmlFor={`${id}-key`}>{keyLabel}</FormLabel>
          <Input
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type="text"
          />
        </FormControl>
      </GridItem>
      <GridItem>{children}</GridItem>
      <GridItem>
        <IconButton
          icon="remove"
          tabIndex={-1}
          // style={btnStyle as any}
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
        />
      </GridItem>
    </Grid>
  );
};

export default WrapIfAdditional;
