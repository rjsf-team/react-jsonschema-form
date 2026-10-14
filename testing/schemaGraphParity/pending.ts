import type { PendingSurface } from './types.ts';

const overflow = 'RangeError: Maximum call stack size exceeded';
const outOfMemory = 'the worker running out of memory';

/** v7 overflows the stack on these, in every surface but `retrieveSchema` where the next list doesn't say so */
const overflowing = [
  '5500 allOf properties',
  '5500 allOf items',
  '5500 then properties',
  '5500 items then',
  '5500 deps ref',
  '5500 deps properties',
  'A<->B deps root',
  'A<->B deps prop',
  'A<->B deps items',
  '5452a',
  '5452b',
  '5452c',
];

export const pendingSurfaces: readonly PendingSurface[] = [
  ...overflowing.flatMap((name): PendingSurface[] => [
    { family: 'recursion', name, surface: 'getDefaultFormState', v7: overflow },
    { family: 'recursion', name, surface: 'ajv8Defaults', v7: overflow },
    { family: 'recursion', name, surface: 'render', v7: overflow },
  ]),
  ...['5452a', '5452b'].map((name): PendingSurface => ({
    family: 'recursion',
    name,
    surface: 'retrieveSchema',
    v7: overflow,
  })),
  ...['5501 allOf', '5501 then', 'self anyOf option', 'X growing allOf child', 'N self anyOf option click'].map(
    (name): PendingSurface => ({ family: 'recursion', name, surface: 'render', v7: outOfMemory }),
  ),
  ...['T lcm 2,3', 'T alias pct allOf', 'K4', 'K5'].map((name): PendingSurface => ({
    family: 'termination',
    name,
    surface: 'render',
    v7: outOfMemory,
  })),
  { family: 'termination', name: 'K3', surface: 'interaction', v7: outOfMemory },
  { family: 'termination', name: 'K5', surface: 'getDefaultFormState', v7: 'about 10 s per call' },
  { family: 'termination', name: 'K5', surface: 'ajv8Defaults', v7: 'about 10 s per call' },
  ...['11', '11 populate', '15', '15 populate', '16', '23 ->loop', '47 ->loop', 'F collapsed typed sibling prop'].map(
    (name): PendingSurface => ({ family: 'captured', name, surface: 'render', v7: outOfMemory }),
  ),
];
