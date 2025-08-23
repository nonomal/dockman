import {createContext, useContext} from "react";

export interface GitImportContextType {
    isVisible: boolean
    closeDialog: () => void
    showDialog: () => void
}

export const GitImportContext = createContext<GitImportContextType | undefined>(undefined)

// Hook to use the changelog context
export function useGitImport() {
    const context = useContext(GitImportContext)
    if (!context) {
        throw new Error('useTelescope must be used within a TelescopeProvider')
    }
    return context
}
