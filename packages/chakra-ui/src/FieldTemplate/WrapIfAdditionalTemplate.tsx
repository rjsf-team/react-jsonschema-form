import React from "react";
import {
  ADDITIONAL_PROPERTY_FLAG,
  getTemplate,
  getUiOptions,
  WrapIfAdditionalTemplateProps,
} from "@rjsf/utils";
import {
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Input,
} from "@chakra-ui/react";

const WrapIfAdditionalTemplate = (props: WrapIfAdditionalTemplateProps) => {
  const {
    children,
    classNames,
    disabled,
    id,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    registry,
    required,
    schema,
    uiSchema,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const { RemoveButton } = getTemplate("ButtonTemplates", registry, uiOptions);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  if (!additional) {
    return <div className={classNames}>{children}</div>;
  }
  const keyLabel = `${label} Key`;

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onKeyChange(target.value);

  return (
    <Grid key={`${id}-key`} className={classNames} alignItems="center" gap={2}>
      <GridItem>
        <FormControl isRequired={required}>
          <FormLabel htmlFor={`${id}-key`} id={`${id}-key-label`}>
            {keyLabel}
          </FormLabel>
          <Input
            defaultValue={label}
            disabled={disabled || readonly}
            id={`${id}-key`}
            name={`${id}-key`}
            onBlur={!readonly ? handleBlur : undefined}
            type="text"
            mb={1}
          />
        </FormControl>
      </GridItem>
      <GridItem>{children}</GridItem>
      <GridItem>
        <RemoveButton
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
          uiSchema={uiSchema}
        />
      </GridItem>
    </Grid>
  );
};

export default WrapIfAdditionalTemplate;
