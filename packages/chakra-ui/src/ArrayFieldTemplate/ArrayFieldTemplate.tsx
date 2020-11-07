import React, { VoidFunctionComponent } from "react";
//@ts-ignore
import { isMultiSelect, getDefaultRegistry, } from "@rjsf/core/lib/utils";
import { ArrayFieldTemplateProps, IdSchema } from "@rjsf/core";


/* Chakra Ui components */

/* Local Components */
import AddButton from "../AddButton/AddButton";
import IconButton from "../IconButton/IconButton";
import { Divider, FormLabel, Flex, Box } from "@chakra-ui/core";

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps): JSX.Element => {
  const { schema, registry = getDefaultRegistry() } = props;

  if (isMultiSelect(schema, registry.rootSchema)) {
    return <DefaultFixedArrayFieldTemplate {...props} />;
  }
  return <DefaultNormalArrayFieldTemplate {...props} />;
};

interface ArrayFieldTitleProps {
  TitleField: any;
  idSchema: IdSchema;
  title: string;
  required: boolean;
}
const ArrayFieldTitle = ({
  TitleField,
  idSchema,
  title,
  required,
}: ArrayFieldTitleProps) => {
  const id = `${idSchema.$id}__title`;
  if (!title) {
    return <TitleField id={id} title={title} required={required} />;
  }

  return (
    <>
      <Divider mb={3} />
      <FormLabel fontSize="0.9rem" fontWeight="500" htmlFor={id}>
        {title}
      </FormLabel>
    </>
  );
};

type ArrayFieldDescriptionProps = {
  DescriptionField: any;
  idSchema: IdSchema;
  description: string;
};

const ArrayFieldDescription: React.FC<ArrayFieldDescriptionProps> = ({
  DescriptionField,
  idSchema,
  description,
}): JSX.Element => {
  if (!description) {
    return <React.Fragment />;
  }

  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
};
type TIndex = number | string | any;
type TDefaultArrayItem = ArrayFieldTemplateProps & {
  children: React.ReactChildren;
  hasToolbar: boolean;
  index: TIndex
  hasMoveUp: boolean;
  hasMoveDown: boolean;
  hasRemove: boolean;
  onReorderClick: (x: TIndex, y: TIndex) => void;
  onDropIndexClick: (x: TIndex) => VoidFunctionComponent;
}

// Used in the two templates
const DefaultArrayItem = ({
  index,
  children,
  hasToolbar,
  hasMoveUp,
  hasMoveDown,
  disabled,
  readonly,
  hasRemove,
  onReorderClick,
  onDropIndexClick,
}: TDefaultArrayItem) => {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };
  return (
    <Flex key={index} alignItems="flex-end" justifyContent="flex-start">
      <Box flexGrow={1} py={1} mb={1}>
        {children}
      </Box>

      {hasToolbar && (
        <Flex
          justify="space-between"
          alignItems="flex-end"
          direction={["column", "row"]}
          pb={[2, 2]}
          pl={1}
          ml={1}
        >
          {(hasMoveUp || hasMoveDown) && (
            <IconButton
              p={2}
              mt={2}
              minHeight="35px"
              minWidth="35px"
              iconMap="arrow-up"
              className="array-item-move-up"
              tabIndex={-1}
              style={btnStyle}
              isDisabled={disabled || readonly || !hasMoveUp}
              onClick={onReorderClick(index, index - 1)}
            />
          )}

          {(hasMoveUp || hasMoveDown) && (
            <IconButton
              p={2}
              mt={2}
              mx={[0, 1]}
              minHeight="35px"
              minWidth="35px"
              iconMap="arrow-down"
              tabIndex={-1}
              style={btnStyle}
              isDisabled={disabled || readonly || !hasMoveDown}
              onClick={onReorderClick(index, index + 1)}
            />
          )}

          {hasRemove && (
            <IconButton
              p={2}
              mt={2}
              minHeight="35px"
              minWidth="35px"
              iconMap="remove"
              tabIndex={-1}
              style={btnStyle}
              isDisabled={disabled || readonly}
              onClick={onDropIndexClick(index)}
            />
          )}
        </Flex>
      )}
    </Flex>
  );
};

const DefaultFixedArrayFieldTemplate = ({
  className,
  idSchema,
  TitleField,
  title,
  required,
  schema,
  uiSchema,
  items,
  canAdd,
  onAddClick,
  disabled,
  readonly,
}: ArrayFieldTemplateProps) => {
  return (
    <fieldset className={className}>
      <ArrayFieldTitle
        key={`array-field-title-${idSchema.$id}`}
        TitleField={TitleField}
        idSchema={idSchema}
        title={uiSchema["ui:title"] || title}
        required={required}
      />

      {(uiSchema["ui:description"] || schema.description) && (
        <div
          className="field-description"
          key={`field-description-${idSchema.$id}`}
        >
          {uiSchema["ui:description"] || schema.description}
        </div>
      )}

      <div
        className="row array-item-list"
        key={`array-item-list-${idSchema.$id}`}
      >
        {items && items.map(DefaultArrayItem as any)}
      </div>

      {canAdd && (
        <AddButton
          className="array-item-add"
          onClick={onAddClick}
          disabled={disabled || readonly}
        />
      )}
    </fieldset>
  );
};

const DefaultNormalArrayFieldTemplate = ({
  idSchema,
  TitleField,
  DescriptionField,
  uiSchema,
  schema,
  title,
  required,
  items,
  canAdd,
  onAddClick,
  disabled,
  readonly,
}: ArrayFieldTemplateProps) => {
  return (
    <Box py={2}>
      <ArrayFieldTitle
        key={`array-field-title-${idSchema.$id}`}
        TitleField={TitleField}
        idSchema={idSchema}
        title={uiSchema["ui:title"] || title}
        required={required}
      />

      {(uiSchema["ui:description"] || schema.description) && (
        <ArrayFieldDescription
          key={`array-field-description-${idSchema.$id}`}
          DescriptionField={DescriptionField}
          idSchema={idSchema}
          description={uiSchema["ui:description"] || schema.description}
        />
      )}

      <Flex
        key={`array-item-list-${idSchema.$id}`}
        direction="column"
        justify="center"
      >
        {items && items.map((p) => DefaultArrayItem(p as any))}

        {canAdd && (
          <Flex justify="flex-end">
            <Box mt={2}>
              <AddButton onClick={onAddClick} isDisabled={disabled || readonly}>
                Add More
              </AddButton>
            </Box>
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default ArrayFieldTemplate;
