import {createContext, useContext} from "react";

export interface TelescopeContextType {
    isVisible: boolean
    dismissChangelog: () => void
    showTelescope: () => void
}

export const TelescopeContext = createContext<TelescopeContextType | undefined>(undefined)

// Hook to use the changelog context
export function useTelescope() {
    const context = useContext(TelescopeContext)
    if (!context) {
        throw new Error('useTelescope must be used within a TelescopeProvider')
    }
    return context
}
