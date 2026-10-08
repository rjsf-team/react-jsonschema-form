import { formTests, themeTests } from '@rjsf/snapshot-tests';

import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });
