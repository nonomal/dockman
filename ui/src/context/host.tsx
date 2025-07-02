import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {callRPC, useClient} from '../lib/api'
import {useSnackbar} from '../hooks/snackbar'
import {HostManagerService} from '../gen/host_manager/v1/host_manager_pb'
import {HostContext} from '../hooks/host'

interface HostProviderProps {
    children: ReactNode
}

export function HostProvider({children}: HostProviderProps) {
    const hostManagerClient = useClient(HostManagerService)
    const {showError} = useSnackbar()

    const [availableHosts, setAvailableHosts] = useState<string[]>([])
    const [selectedHost, setSelectedHost] = useState<string | null>(null)
    const [isLoading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHosts = async () => {
            setLoading(true)
            const {val, err} = await callRPC(() => hostManagerClient.list({}))
            if (err) {
                showError(err)
                setLoading(false)
                return
            }

            setAvailableHosts(val?.machines.map(value => value.name) || [])
            setSelectedHost(val?.activeClient || null)
            setLoading(false)
        }

        fetchHosts()
    }, [hostManagerClient])


    const switchMachine = useCallback(async (machine: string) => {
        if (!machine || machine === selectedHost) return

        console.log(`Switching to machine: ${machine}`)
        const {err} = await callRPC(() => hostManagerClient.switchClient({machineID: machine}))

        if (err) {
            showError(err)
        } else {
            setSelectedHost(machine)
        }
    }, [hostManagerClient, selectedHost])

    const value = {availableHosts, selectedHost, isLoading, switchMachine}
    return (
        <HostContext.Provider value={value}>
            {children}
        </HostContext.Provider>
    )
}
