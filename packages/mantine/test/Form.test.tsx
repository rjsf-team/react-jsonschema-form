import { formTests } from '@rjsf/snapshot-tests';

import WrappedForm from './WrappedForm';

jest.mock('@mantine/hooks', () => ({
  ...jest.requireActual('@mantine/hooks'),
  useMove: jest.fn,
}));

formTests(WrappedForm);
