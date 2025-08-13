import {type ReactNode, useCallback, useState} from 'react'
import Telescope from "../components/telescope.tsx";
import {TelescopeContext} from "./telescope-hook.ts";

interface TelescopeProviderProps {
    children: ReactNode
}

export function TelescopeProvider({children}: TelescopeProviderProps) {
    const [isVisible, setIsVisible] = useState(false)

    const dismissChangelog = useCallback(async () => {
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
