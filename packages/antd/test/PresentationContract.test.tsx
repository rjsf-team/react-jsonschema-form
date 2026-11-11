import { presentationContractTests } from '@rjsf/snapshot-tests';

import Form, { generateWidgets } from '../src/index.ts';

presentationContractTests(Form, generateWidgets());
