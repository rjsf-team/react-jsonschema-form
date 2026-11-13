import { hideErrorTests } from '@rjsf/snapshot-tests';

import { generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

hideErrorTests(WrappedForm, generateWidgets());
