import {type ReactNode, useCallback, useState} from 'react'
import {TelescopeContext} from "./search-hook.ts";
import TelescopeUI from "./search-ui.tsx";

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
            <TelescopeUI
                isVisible={isVisible}
                onDismiss={dismissChangelog}
            />
        </TelescopeContext.Provider>
    )
}
