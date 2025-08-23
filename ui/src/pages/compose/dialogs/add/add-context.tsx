import {type ReactNode, useState} from 'react'
import {AddFileContext} from "./add-hook.ts";
import {FileDialogCreate} from "./add-ui.tsx";
import {useFiles} from "../../../../hooks/files.ts";

interface AddFilesProps {
    children: ReactNode
}

export function AddFilesProvider({children}: AddFilesProps) {
    const [isVisible, setIsVisible] = useState(false)
    const {addFile} = useFiles()
    const [parent, setParent] = useState("")

    const closeDialog = () => {
        setIsVisible(false)
        setParent("")
    }

    const handleAddConfirm = (filename: string) => {
        addFile(filename, parent).then(() => {
            closeDialog()
        })
    }

    const showDialog = (parent?: string) => {
        setParent(parent ?? "")
        setIsVisible(true)
    }

    const value = {
        isVisible,
        closeDialog,
        showDialog
    }

    return (
        <AddFileContext.Provider value={value}>
            {children}
            <FileDialogCreate
                open={isVisible}
                onClose={closeDialog}
                onConfirm={handleAddConfirm}
                parentName={parent}
            />
        </AddFileContext.Provider>
    )
}
