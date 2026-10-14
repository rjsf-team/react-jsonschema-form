import { capturedShapes } from './capturedShapes.ts';
import { recursionShapes } from './recursionShapes.ts';
import { terminationShapes } from './terminationShapes.ts';
import type { ParityFamily, ParityShape } from './types.ts';

export const parityCorpus: Readonly<Record<ParityFamily, readonly ParityShape[]>> = {
  recursion: recursionShapes,
  termination: terminationShapes,
  captured: capturedShapes,
};

export const parityFamilies: readonly ParityFamily[] = ['recursion', 'termination', 'captured'];
