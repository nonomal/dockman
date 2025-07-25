import {type ReactNode, useCallback, useState} from 'react'
import Telescope from "../components/telescope.tsx";
import { useSnackbar } from '../../../hooks/snackbar.ts';
import {TelescopeContext} from "./telescope-hook.ts";

interface TelescopeProviderProps {
    children: ReactNode
}

export function TelescopeProvider({children}: TelescopeProviderProps) {
    const {showError} = useSnackbar()

    const [isVisible, setIsVisible] = useState(false)

    const dismissChangelog = useCallback(async () => {
        showError("")
        setIsVisible(false)
    }, [])

    const showTelescope = () => {
        setIsVisible(true)
    }

    const value = {
        isVisible,
        dismissChangelog,
        showTelescope
    }

    return (
        <TelescopeContext.Provider value={value}>
            {children}
            <Telescope
                isVisible={isVisible}
                onDismiss={dismissChangelog}
            />
        </TelescopeContext.Provider>
    )
}
