import { hideErrorTests } from '@rjsf/snapshot-tests';

import { generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useMove: vi.fn,
}));

hideErrorTests(WrappedForm, generateWidgets());
