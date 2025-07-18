import {createContext, useContext} from "react";

interface HostContextType {
    availableHosts: string[];
    selectedHost: string | null;
    isLoading: boolean;
    switchMachine: (machine: string) => Promise<void>;
    fetchHosts: () => Promise<void>;
}

export const HostContext = createContext<HostContextType | undefined>(undefined);

export function useHost() {
    const context = useContext(HostContext);
    if (context === undefined) {
        throw new Error('useHost must be used within a HostProvider');
    }
    return context;
}