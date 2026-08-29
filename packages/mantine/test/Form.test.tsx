import { formTests } from '@rjsf/snapshot-tests';

import WrappedForm from './WrappedForm.js';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useMove: vi.fn,
}));

formTests(WrappedForm);
