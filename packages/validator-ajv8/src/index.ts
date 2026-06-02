import createPrecompiledValidator from './createPrecompiledValidator';
import customizeValidator from './customizeValidator';

export { customizeValidator, createPrecompiledValidator };
export type * from './types';

export default customizeValidator();
