import {createContext, useContext} from "react";

export interface DeleteFileContextType {
    isVisible: boolean
    closeDialog: () => void
    showDialog: (file: string) => void
}

export const TelescopeContext = createContext<DeleteFileContextType | undefined>(undefined)

// Hook to use the changelog context
export function useFileDelete() {
    const context = useContext(TelescopeContext)
    if (!context) {
        throw new Error('useTelescope must be used within a TelescopeProvider')
    }
    return context
}
