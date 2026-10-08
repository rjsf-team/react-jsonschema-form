import Form, { generateWidgets } from '@rjsf/core';

import { hideErrorTests } from '../src/index.ts';

hideErrorTests(Form, generateWidgets());
