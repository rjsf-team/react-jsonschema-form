import { Text, Divider, makeStyles } from '@fluentui/react-components';
import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

const useStyles = makeStyles({
  root: {
    marginTop: '8px',
    marginBottom: '8px',
  },
});

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
}: TitleFieldProps<T, S, F>) {
  const classes = useStyles();
  return (
    <div id={id} className={classes.root}>
      <Text as='h5' size={600}>
        {title}
      </Text>
      <Divider />
    </div>
  );
}
