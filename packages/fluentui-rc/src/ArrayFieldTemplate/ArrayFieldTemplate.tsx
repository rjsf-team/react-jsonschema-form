import { makeStyles, shorthands } from '@fluentui/react-components';
import { Flex } from '@fluentui/react-migration-v0-v9';
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldItemTemplateType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  buttonId,
} from '@rjsf/utils';

const useStyles = makeStyles({
  arrayItemList: {
    ...shorthands.gap('12px'),
  },
});

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const { canAdd, disabled, idSchema, uiSchema, items, onAddClick, readonly, registry, required, schema, title } =
    props;
  const classes = useStyles();
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <>
      <ArrayFieldTitleTemplate
        idSchema={idSchema}
        title={uiOptions.title || title}
        schema={schema}
        uiSchema={uiSchema}
        required={required}
        registry={registry}
      />
      <ArrayFieldDescriptionTemplate
        idSchema={idSchema}
        description={uiOptions.description || schema.description}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      <Flex column key={`array-item-list-${idSchema.$id}`} className={classes.arrayItemList}>
        {items &&
          items.map(({ key, ...itemProps }: ArrayFieldItemTemplateType<T, S, F>) => (
            <ArrayFieldItemTemplate key={key} {...itemProps} />
          ))}
        {canAdd && (
          <Flex hAlign='end'>
            <AddButton
              id={buttonId<T>(idSchema, 'add')}
              className='rjsf-array-item-add'
              onClick={onAddClick}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Flex>
        )}
      </Flex>
    </>
  );
}
