import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {callRPC, useClient} from "../lib/api.ts";
import {useSnackbar} from "../hooks/snackbar.ts";
import {ConfigService, type UserConfig} from "../gen/config/v1/config_pb.ts";
import {ConfigContext, type ConfigContextType} from "../hooks/config.ts";

export type Config = Omit<UserConfig, '$typeName' | '$unknown'>;

export function UserConfigProvider({children}: { children: ReactNode }) {
    const client = useClient(ConfigService)
    const {showError, showSuccess} = useSnackbar()
    const [config, setConfig] = useState<Config>({
        useComposeFolders: false
    })
    const [isLoading, setIsLoading] = useState(true)


    const fetchConfig = useCallback(async () => {
        console.log("Fetching user config...")
        setIsLoading(true)

        const {val, err} = await callRPC(() => client.getUserConfig({}))
        if (err) {
            showError(err)
        } else if (val) {
            setConfig(val)
        }
        setIsLoading(false)
    }, [client])

    const updateSettings = useCallback(async (user: Config) => {
        const {err} = await callRPC(() => client.setUserConfig(user))
        if (err) {
            showError(`Error saving file: ${err}`)
        } else {
            showSuccess(`Settings updated.`)
        }

        await fetchConfig()
    }, [client, fetchConfig])

    useEffect(() => {
        fetchConfig().then()
    }, [fetchConfig])

    const value: ConfigContextType = {
        config,
        isLoading,
        updateSettings,
    }

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    )
}
