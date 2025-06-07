import { makeStyles } from '@fluentui/react-components';
import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

const useStyles = makeStyles({
  root: {
    '> div': { marginBottom: '4px' },
  },
});

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { selector, optionSchemaField } = props;

  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div>{selector}</div>
      {optionSchemaField}
    </div>
  );
}
