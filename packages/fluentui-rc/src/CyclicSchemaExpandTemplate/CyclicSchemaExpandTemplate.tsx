import { Button, Card, Text, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { expandButtonId, TranslatableString } from '@rjsf/utils';

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    marginTop: tokens.spacingVerticalL,
    '&::after': {
      ...shorthands.borderColor(tokens.colorStatusWarningBorder1),
    },
  },
  buttonRow: {
    marginTop: tokens.spacingVerticalS,
  },
});

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, id, registry, onExpand } = props;
  const { translateString } = registry;
  const classes = useStyles();
  return (
    <Card appearance='outline' className={classes.card}>
      <Text>{translateString(TranslatableString.CycleDetected, [name])}</Text>
      <div className={classes.buttonRow}>
        <Button id={expandButtonId(id)} appearance='secondary' onClick={() => onExpand(id)}>
          {translateString(TranslatableString.ExpandButton)}
        </Button>
      </div>
    </Card>
  );
}
