import { presentationContractTests } from '@rjsf/snapshot-tests';

import { generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

presentationContractTests(WrappedForm, generateWidgets());
