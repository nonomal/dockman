import {useCallback, useEffect, useState} from 'react'
import {callRPC, useClient} from '../lib/api.ts'
import {type ContainerList, DockerService} from '../gen/docker/v1/docker_pb.ts'
import {useSnackbar} from "./snackbar.ts"
import {useHost} from "./host.ts";

export function useDockerContainers() {
    const dockerService = useClient(DockerService)
    const {showWarning} = useSnackbar()
    const {selectedHost} = useHost()

    const [containers, setContainers] = useState<ContainerList[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshInterval, setRefreshInterval] = useState(2000)

    const fetchContainers = useCallback(async () => {
        const {val, err} = await callRPC(() => dockerService.containerList({}))
        if (err) {
            showWarning(`Failed to refresh containers: ${err}`)
            setContainers([])
            return
        }

        setContainers(val?.list || [])
    }, [dockerService, selectedHost])

    const refreshContainers = useCallback(() => {
        fetchContainers().finally(() => setLoading(false))
    }, [fetchContainers]);

    useEffect(() => {
        setLoading(true)
        fetchContainers().then(() => {
            setLoading(false)
        })
    }, [fetchContainers]) // run only once on page load

    // fetch without setting load
    useEffect(() => {
        fetchContainers().then()
        const intervalId = setInterval(fetchContainers, refreshInterval)
        return () => clearInterval(intervalId)
    }, [fetchContainers, refreshInterval])

    return {containers, loading, refreshContainers, fetchContainers, refreshInterval, setRefreshInterval}
}