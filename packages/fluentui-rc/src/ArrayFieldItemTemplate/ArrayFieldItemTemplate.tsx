import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Flex } from '@fluentui/react-migration-v0-v9';
import { makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  arrayFieldItem: {
    '> .form-group': {
      width: '100%',
    },
  },
});

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const classes = useStyles();
  const { children, buttonsProps, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );

  return (
    <Flex vAlign='end'>
      <Flex fill className={classes.arrayFieldItem}>
        {children}
      </Flex>
      {hasToolbar && (
        <Flex style={{ marginLeft: '8px' }}>
          <ArrayFieldItemButtonsTemplate {...buttonsProps} />
        </Flex>
      )}
    </Flex>
  );
}
