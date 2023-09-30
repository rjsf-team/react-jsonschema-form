import { ReactNode, createContext, useContext } from 'react';

export interface CarbonOptionsContextType {
  stackGap: number;
}
const defaultContext: CarbonOptionsContextType = {
  stackGap: 7,
};
const CarbonOptionsContext = createContext<CarbonOptionsContextType>(defaultContext);

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

export function useNestDepth() {
  return useContext(NestDepthContext);
}

export function NestDepth({ children }: { children: ReactNode }) {
  const depth = useNestDepth();
  return <NestDepthContext.Provider value={depth + 1}>{children}</NestDepthContext.Provider>;
}
