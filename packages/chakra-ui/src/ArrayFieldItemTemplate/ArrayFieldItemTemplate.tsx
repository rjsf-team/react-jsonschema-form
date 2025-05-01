import { Box, ButtonGroup, HStack } from '@chakra-ui/react';
import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, buttonsProps, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );

  return (
    <HStack alignItems={'flex-end'} py={1}>
      <Box w='100%'>{children}</Box>
      {hasToolbar && (
        <Box>
          <ButtonGroup attached mb={1}>
            <ArrayFieldItemButtonsTemplate {...buttonsProps} />
          </ButtonGroup>
        </Box>
      )}
    </HStack>
  );
}
