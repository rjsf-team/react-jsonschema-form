import { formTests, themeTests } from '@rjsf/snapshot-tests';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

formTests(WrappedForm);
themeTests({ generateTemplates, generateTheme, generateWidgets });
