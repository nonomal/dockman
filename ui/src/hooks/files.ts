import {createContext, useContext} from "react";

export interface FileGroup {
    name: string
    children: string[]
}

export interface FilesContextType {
    files: FileGroup[]
    isLoading: boolean
    addFile: (filename: string, parent: string) => Promise<void>
    deleteFile: (filename: string) => Promise<void>
    renameFile: (olfFilename: string, newFile: string) => Promise<void>
    refetch: () => Promise<void>
}

export const FilesContext = createContext<FilesContextType | undefined>(undefined)

export function useFiles() {
    const context = useContext(FilesContext)
    if (context === undefined) {
        throw new Error('useFiles must be used within a FilesProvider')
    }
    return context
}