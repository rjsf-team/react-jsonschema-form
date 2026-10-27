import { hideErrorTests, optionErrorStateTests, wrapIfAdditionalErrorStateTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
hideErrorTests(Form, {});

// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
optionErrorStateTests(Form, (container) =>
  container.querySelector('label[for="root"]')?.closest('.form-group')?.classList.contains('has-error'),
);

// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
wrapIfAdditionalErrorStateTests(Form);
