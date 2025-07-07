import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {callRPC, useClient} from '../lib/api'
import {useSnackbar} from '../hooks/snackbar'
import {HostContext} from '../hooks/host'
import {DockerManagerService} from "../gen/docker_manager/v1/docker_manager_pb.ts";
import {useLocation, useNavigate} from 'react-router-dom';

interface HostProviderProps {
    children: ReactNode
}

export function HostProvider({children}: HostProviderProps) {
    const hostManagerClient = useClient(DockerManagerService)
    const {showError} = useSnackbar()
    const loc = useLocation()

    const [availableHosts, setAvailableHosts] = useState<string[]>([])
    const [selectedHost, setSelectedHost] = useState<string | null>(null)
    const [isLoading, setLoading] = useState(true)
    const navigate = useNavigate()

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

        if (loc.pathname.startsWith('/files')) {
            navigate("/files")
        }

    }, [hostManagerClient, loc.pathname, navigate, selectedHost])

    const value = {availableHosts, selectedHost, isLoading, switchMachine}
    return (
        <HostContext.Provider value={value}>
            {children}
        </HostContext.Provider>
    )
}
