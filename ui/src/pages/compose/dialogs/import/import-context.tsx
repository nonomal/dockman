import {type ReactNode, useCallback, useState} from 'react'
import {GitImportContext} from "./import-hook.ts";
import {FilesImportDialog} from "./import-ui.tsx";
import {useHost} from "../../../../hooks/host.ts";

interface GitImportProps {
    children: ReactNode
}

export function GitImportProvider({children}: GitImportProps) {
    const [isVisible, setIsVisible] = useState(false)
    const {selectedHost} = useHost()

    const closeDialog = useCallback(async () => {
        setIsVisible(false)
    }, [])

    const showDialog = () => {
        setIsVisible(true)
    }

    const value = {
        isVisible,
        closeDialog,
        showDialog
    }

    return (
        <GitImportContext.Provider value={value}>
            {children}
            <FilesImportDialog
                open={isVisible}
                onClose={closeDialog}
                onImportComplete={() => {
                }}
                currentBranch={selectedHost ?? ""}
            />
        </GitImportContext.Provider>
    )
}
