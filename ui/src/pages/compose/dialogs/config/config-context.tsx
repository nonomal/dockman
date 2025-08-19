import {type ReactNode, useState} from 'react'
import {AddFileContext} from "./config-hook.ts";
import FileConfigDialog from "./config-ui.tsx";

interface FileConfigProps {
    children: ReactNode
}

export function FileConfigProvider({children}: FileConfigProps) {
    const [isVisible, setIsVisible] = useState(false)

    const closeDialog = () => {
        setIsVisible(false)
    }

    const showDialog = () => {
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
            <FileConfigDialog
                open={isVisible}
                onClose={closeDialog}
            />
        </AddFileContext.Provider>
    )
}
