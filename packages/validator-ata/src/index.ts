import createPrecompiledValidator from './createPrecompiledValidator.js';
import customizeValidator from './customizeValidator.js';

export { customizeValidator, createPrecompiledValidator };
export { default as ATAValidator } from './validator.js';
export type * from './types.js';

export default customizeValidator();
