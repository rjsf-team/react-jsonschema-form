import { hideErrorTests, optionErrorStateTests, wrapIfAdditionalErrorStateTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

hideErrorTests(Form, {});

optionErrorStateTests(Form, (container) =>
  container.querySelector('label[for="root"]')?.closest('.form-group')?.classList.contains('has-error'),
);

wrapIfAdditionalErrorStateTests(Form);
