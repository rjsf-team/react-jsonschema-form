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
  F extends FormContextType = any
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { buttonsProps, className, hasToolbar, index, uiSchema, registry, children } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions
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

/*
{(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                iconType='sm'
                className='array-item-move-up'
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                iconType='sm'
                className='array-item-move-down'
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasCopy && (
              <CopyButton
                iconType='sm'
                className='array-item-copy'
                disabled={disabled || readonly}
                onClick={onCopyIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasRemove && (
              <RemoveButton
                iconType='sm'
                className='array-item-remove'
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
 */
