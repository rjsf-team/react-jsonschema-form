import { presentationContractTests } from '@rjsf/snapshot-tests';

import { generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useMove: vi.fn,
}));

// `testSetup.ts` pins `Math.random` for stable snapshot ids, which gives every Mantine listbox the same random id, where
// a browser gives each its own
let draws = 0;
beforeEach(() => {
  vi.mocked(Math.random).mockImplementation(() => {
    draws += 1;
    return (draws % 1000) / 1000;
  });
});

presentationContractTests(WrappedForm, generateWidgets());
