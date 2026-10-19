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
      {/* No row is laid out for a selector the field doesn't render, as while an optional field has no data (#5401) */}
      {selector ? <div>{selector}</div> : null}
      {optionSchemaField}
    </div>
  );
}
