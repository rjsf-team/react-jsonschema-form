import { formTests } from '@rjsf/snapshot-tests';

import Form from '../src';
import { COMPUTED_STYLE_MOCK, FORM_RENDER_OPTIONS } from './snapshotConstants';

// The `TextareaAutosize` code reads the following data from the `getComputedStyle()` function in a useEffect hook
jest.spyOn(window, 'getComputedStyle').mockImplementation(() => COMPUTED_STYLE_MOCK);

formTests(Form, FORM_RENDER_OPTIONS);
