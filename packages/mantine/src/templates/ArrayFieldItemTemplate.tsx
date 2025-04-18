import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Box, Flex, Group } from '@mantine/core';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { buttonsProps, className, hasToolbar, index, uiSchema, registry, children } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );

  return (
    <Box key={`array-item-${index}`} className={className || 'array-item'} mb='xs'>
      <Flex gap='xs' align='end' justify='center'>
        <Box w='100%'>{children}</Box>
        {hasToolbar && (
          <Group wrap='nowrap' gap={2} mb={7}>
            <ArrayFieldItemButtonsTemplate {...buttonsProps} />
          </Group>
        )}
      </Flex>
    </Box>
  );
}
