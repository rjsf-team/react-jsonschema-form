import { makeStyles } from '@fluentui/react-components';
import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

const useStyles = makeStyles({
  root: {
    '> div': { marginBottom: '4px' },
  },
});

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
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
