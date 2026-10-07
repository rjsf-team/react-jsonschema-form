import { createContext, use } from 'react';

/** The component a core component renders, directly below this context, with the form's own data at that component's
 * path. A field that finds itself named here reads the form's latest edit at its path; a custom component in between
 * may have handed it a view of that data instead, so anything else, `undefined` included, means its `formData` prop is
 * all it can trust. Each core field resets the context over the templates and widgets it renders, so a value only ever
 * describes the element it was set directly around.
 */
const RawFormDataContext = createContext<unknown>(undefined);

/** Whether `self`, the core component asking, is the one the context names: rendered directly below it with the form's
 * own data at its path
 */
export function useReadsFormData(self: unknown) {
  return use(RawFormDataContext) === self;
}

export default RawFormDataContext;
