import { hideErrorTests } from '@rjsf/snapshot-tests';

import Form, { generateWidgets } from '../src/index.ts';

hideErrorTests(Form, generateWidgets());
