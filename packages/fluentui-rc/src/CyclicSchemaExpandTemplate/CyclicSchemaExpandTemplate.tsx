import { Button, Card, Text, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';

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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, fieldPathId, registry, onExpand } = props;
  const { translateString } = registry;
  const classes = useStyles();
  const buttonId = `${fieldPathId[ID_KEY]}-button`;
  return (
    <Card appearance='outline' className={classes.card}>
      <Text>{translateString(TranslatableString.CycleDetected, [name])}</Text>
      <div className={classes.buttonRow}>
        <Button id={buttonId} appearance='secondary' onClick={() => onExpand(fieldPathId[ID_KEY])}>
          {translateString(TranslatableString.ExpandButton)}
        </Button>
      </div>
    </Card>
  );
}
