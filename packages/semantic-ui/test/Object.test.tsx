import { objectTests } from '@rjsf/snapshot-tests';

import Form from '../src';

/** Mock the `react-component-ref` component used by semantic-ui to simply render the children, otherwise tests fail */
vi.mock('@fluentui/react-component-ref', async (importOriginal) => ({
  ...(await importOriginal()),
  Ref: vi.fn().mockImplementation(({ children }) => children),
}));

objectTests(Form);
