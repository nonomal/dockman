import {type ReactNode, useState} from 'react'
import {TelescopeContext} from "./delete-hook.ts";
import FileDialogDelete from "./delete-ui.tsx";
import {useFiles} from "../../../../hooks/files.ts";

interface DeleteFileProviderProps {
    children: ReactNode
}

export function DeleteFileProvider({children}: DeleteFileProviderProps) {
    const [isVisible, setIsVisible] = useState(false)
    const {deleteFile} = useFiles()
    const [fileToDelete, setFileToDelete] = useState("")

    const showDialog = (file: string) => {
        setIsVisible(true)
        setFileToDelete(file)
    }

    const closeDialog = () => {
        setIsVisible(false)
        setFileToDelete("")
    }

    const value = {
        isVisible,
        closeDialog,
        showDialog,
    }

    return (
        <TelescopeContext.Provider value={value}>
            {children}
            <FileDialogDelete
                fileToDelete={fileToDelete}
                onClose={closeDialog}
                handleDelete={deleteFile}
            />
        </TelescopeContext.Provider>
    )
}
