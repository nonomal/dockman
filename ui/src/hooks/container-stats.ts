import {useCallback, useEffect, useState} from 'react'
import {callRPC, useClient} from '../lib/api.ts'
import {type ContainerStats, DockerService, ORDER, SORT_FIELD} from '../gen/docker/v1/docker_pb.ts'
import {useSnackbar} from "./snackbar.ts"

export function useDockerStats(selectedPage?: string) {
    const dockerService = useClient(DockerService)
    const {showError} = useSnackbar()

    const [containers, setContainers] = useState<ContainerStats[]>([])
    const [loading, setLoading] = useState(true)

    const [field, setField] = useState(SORT_FIELD.MEM)
    const [orderBy, setOrderBy] = useState(ORDER.DSC)
    const [refreshInterval, setRefreshInterval] = useState(2000)

    const fetchStats = useCallback(async () => {
        const {val, err} = await callRPC(() => dockerService.stats({
            sortBy: field,
            order: orderBy,
            file: selectedPage ? {filename: selectedPage} : undefined
        }))
        if (err) {
            showError(err)
            return
        }

        setContainers(val?.containers || [])

    }, [dockerService, field, orderBy, selectedPage])

    const modifySort = (newField: SORT_FIELD, newOrderBy: ORDER) => {
        setField(newField)
        setOrderBy(newOrderBy)
    }

    const fetchWithLoading = useCallback(async () => {
        setLoading(true)
        await fetchStats()
        setLoading(false)
    }, [fetchStats])

    // set loading state only at the initial load
    useEffect(() => {
        fetchWithLoading().then()
    }, []) // Empty dependency array runs only once.

    useEffect(() => {
        fetchStats().then()
        const intervalId = setInterval(fetchStats, refreshInterval)
        return () => clearInterval(intervalId)
    }, [fetchWithLoading, fetchStats, refreshInterval])

    return {
        containers,
        loading,
        fetchStats,
        field,
        orderBy,
        refreshInterval,
        modifySort,
        setRefreshInterval,
    }
}