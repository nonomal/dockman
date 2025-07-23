// Create the changelog context
import {createContext, useContext} from "react";

export interface ChangelogContextType {
    changelog: string
    isChangelogVisible: boolean
    dismissChangelog: () => void
    checkVersion: () => Promise<void>
}

export const ChangelogContext = createContext<ChangelogContextType | undefined>(undefined)

// Hook to use the changelog context
export function useChangelog() {
    const context = useContext(ChangelogContext)
    if (!context) {
        throw new Error('useChangelog must be used within a ChangelogProvider')
    }
    return context
}