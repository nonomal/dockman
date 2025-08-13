import {createContext, useContext} from "react";
import type {Config} from "../context/config-context.tsx";

export interface ConfigContextType {
    config: Config
    isLoading: boolean
    updateSettings: (user: Config) => Promise<void>,
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

// Hook to use the changelog context
export function useConfig() {
    const context = useContext(ConfigContext)
    if (!context) {
        throw new Error('useChangelog must be used within a UserConfigProvider')
    }
    return context
}