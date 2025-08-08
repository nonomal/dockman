import {useCallback, useEffect, useState} from 'react'
import {callRPC, useClient} from '../lib/api.ts'
import {type ContainerList, DockerService} from '../gen/docker/v1/docker_pb.ts'
import {useSnackbar} from "./snackbar.ts"

export function useDockerContainers(selectedPage: string) {
    const dockerService = useClient(DockerService)
    const {showWarning} = useSnackbar()

    const [containers, setContainers] = useState<ContainerList[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshInterval, setRefreshInterval] = useState(2000)

    const fetchContainers = useCallback(async () => {
        if (!selectedPage) {
            setContainers([])
            return
        }

        const {val, err} = await callRPC(() => dockerService.list({filename: selectedPage}))
        if (err) {
            showWarning(`Failed to refresh containers: ${err}`)
            setContainers([])
            return
        }

        setContainers(val?.list || [])
    }, [dockerService, selectedPage])

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

    return {containers, loading, fetchContainers, refreshInterval, setRefreshInterval}
}