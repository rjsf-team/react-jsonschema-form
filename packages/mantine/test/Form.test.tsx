import { formTests, themeTests } from '@rjsf/snapshot-tests';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useMove: vi.fn,
}));

// The `password field` snapshot has no `aria-describedby` on its input because Mantine's `PasswordInput` ignores the
// `InputWrapper` context the other inputs read it from (https://github.com/mantinedev/mantine/issues/9216). Once a
// Mantine release fixes that, the snapshot gains the field's error, description and help ids and needs updating, along
// with the `test.fails` password case in `AriaDescribedBy.test.tsx`. Likewise the `slider field` snapshot's thumb has no
// `aria-describedby` because Mantine's slider `Thumb` drops the `thumbProps` it doesn't use
// (https://github.com/mantinedev/mantine/issues/9218), along with the `test.fails` range case there.
formTests(WrappedForm);
themeTests({ generateTemplates, generateTheme, generateWidgets });
