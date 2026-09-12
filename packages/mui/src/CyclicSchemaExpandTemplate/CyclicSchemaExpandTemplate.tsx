import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, id, registry, onExpand } = props;
  const { translateString } = registry;
  const buttonId = `${id}-button`;
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant='body2' sx={{ color: 'warning.main', mb: 1 }}>
        {translateString(TranslatableString.CycleDetected, [name])}
      </Typography>
      <Button id={buttonId} size='small' variant='outlined' color='warning' onClick={() => onExpand(id)}>
        {translateString(TranslatableString.ExpandButton)}
      </Button>
    </Box>
  );
}
