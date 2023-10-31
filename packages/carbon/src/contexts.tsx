import { ReactNode, createContext, useContext } from 'react';

export const NestDepthContext = createContext<number>(0);

/**
 * Get the current nest depth, used for rendering proper [carbon layers](https://carbondesignsystem.com/guidelines/color/usage#layering-tokens)
 */
export function useNestDepth() {
  return useContext(NestDepthContext);
}

export function NestDepth({ children }: { children: ReactNode }) {
  const depth = useNestDepth();
  return <NestDepthContext.Provider value={depth + 1}>{children}</NestDepthContext.Provider>;
}
