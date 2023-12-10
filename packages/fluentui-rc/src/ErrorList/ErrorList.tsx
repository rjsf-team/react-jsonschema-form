import { Card, Text, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

const useStyles = makeStyles({
  errorCard: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    marginBottom: tokens.spacingVerticalL,
    '&::after': {
      ...shorthands.borderColor(tokens.colorStatusDangerBorder1),
    },
  },
  errorTitle: {
    marginTop: 0,
    marginBottom: 0,
  },
});

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  const classes = useStyles();
  return (
    <Card appearance='outline' className={classes.errorCard}>
      <Text as='h6' size={400} className={classes.errorTitle}>
        {translateString(TranslatableString.ErrorsLabel)}
      </Text>
      <ul>
        {errors.map((error, i: number) => {
          return <li key={i}>{error.stack}</li>;
        })}
      </ul>
    </Card>
  );
}
