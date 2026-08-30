import createPrecompiledValidator from './createPrecompiledValidator.ts';
import customizeValidator from './customizeValidator.ts';

export { customizeValidator, createPrecompiledValidator };
export type * from './types.ts';

export default customizeValidator();
