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

  it('writes the path below an option entry after that entry, collapsing indexes and extra keys past the option', () => {
    const fieldPath = toFieldPath(
      'title',
      toFieldPath(0, toFieldPath('tasks', toFieldPath('key', toFieldPath('map')))),
    );
    const anchor = { depth: 2, prefix: 'uiSchema.anyOf[1]', owner: () => '"root_map_{}" (map{})' };

    expect(entryLabelForLog(fieldPath, globalFormOptions, [1], anchor)).toBe(
      'the uiSchema.anyOf[1].tasks[].title entry of "root_map_{}" (map{})',
    );
  });

  it("names the option's ui:definitions entry beside its own, with the same path below each", () => {
    const fieldPath = toFieldPath('title', toFieldPath(0, toFieldPath('tasks')));
    const anchor = { depth: 0, prefix: 'uiSchema.anyOf[0]', owner: () => '"root"', definition: '#/$defs/Foo' };

    expect(entryLabelForLog(fieldPath, globalFormOptions, undefined, anchor)).toBe(
      'the uiSchema.anyOf[0].tasks[].title entry of "root" (or ui:definitions[\'#/$defs/Foo\'].tasks[].title)',
    );
  });
});
