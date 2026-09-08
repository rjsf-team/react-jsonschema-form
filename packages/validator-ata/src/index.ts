import createPrecompiledValidator from './createPrecompiledValidator.ts';
import customizeValidator from './customizeValidator.ts';

export { customizeValidator, createPrecompiledValidator };
export { default as ATAValidator } from './validator.ts';
export type * from './types.ts';

export default customizeValidator();
