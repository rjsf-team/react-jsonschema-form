import { fieldPathToId, toFieldPath } from '@rjsf/utils';

import { entryLabelForLog } from '../src/fieldLabelForLog.ts';

const globalFormOptions = { idPrefix: 'root', idSeparator: '_' };

describe('entryLabelForLog', () => {
  it('names a uiSchema entry by the id its field renders under, each property name escaped as in that id', () => {
    const fieldPath = toFieldPath('first name', toFieldPath('person'));

    expect(entryLabelForLog(fieldPath, globalFormOptions)).toBe(
      `"${fieldPathToId(fieldPath, globalFormOptions)}" (person.first name)`,
    );
  });

  it('writes each array index as []', () => {
    const fieldPath = toFieldPath('first name', toFieldPath(0, toFieldPath('people')));

    expect(entryLabelForLog(fieldPath, globalFormOptions)).toBe('"root_people_[]_first-_20name" (people[].first name)');
  });
});
