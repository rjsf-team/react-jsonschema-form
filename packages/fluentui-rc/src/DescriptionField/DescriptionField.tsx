import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

const useStyles = makeStyles({
  label: {
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
  },
});

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description } = props;
  const classes = useStyles();
  if (description) {
    return (
      <Text block id={id} className={classes.label}>
        {description}
      </Text>
    );
  }

  return null;
}
