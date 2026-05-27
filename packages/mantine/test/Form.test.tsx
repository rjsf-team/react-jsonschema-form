import { formTests } from '@rjsf/snapshot-tests';

import WrappedForm from './WrappedForm';

vi.mock('@mantine/hooks', async () => ({
  ...(await vi.importActual<typeof import('@mantine/hooks')>('@mantine/hooks')),
  useMove: vi.fn,
}));

formTests(WrappedForm);
