import { createContext, Dispatch, SetStateAction } from 'react';

export interface MunicipalityContextType {
    municipalities: string[];
    setMunicipalities: Dispatch<SetStateAction<string[]>>;
}

export const MunicipalityContext = createContext<MunicipalityContextType>({
    municipalities: [],
    setMunicipalities: () => {},
});
