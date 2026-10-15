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

/** A shape's test runs every preset over repeated passes. The dense definition graphs take a few seconds of that on a
 * workstation and several times longer on a loaded CI runner, so the timeout only has to catch a hang.
 */
export const PARITY_SHAPE_TIMEOUT = 120_000;
