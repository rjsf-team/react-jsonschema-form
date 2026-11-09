import Form, { generateWidgets } from '@rjsf/core';

import { presentationContractTests } from '../src/index.ts';

presentationContractTests(Form, generateWidgets());
