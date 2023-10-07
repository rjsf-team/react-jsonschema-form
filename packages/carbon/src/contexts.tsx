import { ReactNode, createContext, useContext } from 'react';

export interface CarbonOptionsContextType {
  stackGap: number;
  labelMark: 'required' | 'optional';
}
const defaultContext: CarbonOptionsContextType = {
  stackGap: 7,
  labelMark: 'required',
};
const CarbonOptionsContext = createContext<CarbonOptionsContextType>(defaultContext);

// TODO use form context instead of this
export function CarbonOptionsProvider(props: { value: Partial<CarbonOptionsContextType>; children?: ReactNode }) {
  return (
    <CarbonOptionsContext.Provider value={{ ...defaultContext, ...props.value }}>
      {props.children}
    </CarbonOptionsContext.Provider>
  );
}

export function useCarbonOptions() {
  return useContext(CarbonOptionsContext);
}

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
