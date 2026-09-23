import { formTests, themeTests } from '@rjsf/snapshot-tests';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useMove: vi.fn,
}));

formTests(WrappedForm);
themeTests({ generateTemplates, generateTheme, generateWidgets });
