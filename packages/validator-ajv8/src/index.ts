import createPrecompiledValidator from './createPrecompiledValidator.js';
import customizeValidator from './customizeValidator.js';

export { customizeValidator, createPrecompiledValidator };
export type * from './types.js';

export default customizeValidator();
