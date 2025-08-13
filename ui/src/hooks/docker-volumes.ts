import {useCallback, useEffect, useState} from 'react'
import {callRPC, useClient} from '../lib/api.ts'
import {DockerService, type Volume} from '../gen/docker/v1/docker_pb.ts'
import {useSnackbar} from "./snackbar.ts"
import {useHost} from "./host.ts";

export function useDockerVolumes() {
    const dockerService = useClient(DockerService)
    const {showWarning} = useSnackbar()

    const {selectedHost} = useHost()

    const [volumes, setVolumes] = useState<Volume[]>([])
    const [loading, setLoading] = useState(true)

    const fetchVolumes = useCallback(async () => {
        setLoading(true)

        const {val, err} = await callRPC(() => dockerService.volumeList({}))
        if (err) {
            showWarning(`Failed to refresh containers: ${err}`)
            setVolumes([])
            return
        }

        setVolumes(val?.volumes || [])
    }, [dockerService, selectedHost])

    const loadVolumes = useCallback(() => {
        fetchVolumes().finally(() => setLoading(false))
    }, [fetchVolumes])

    useEffect(() => {
        loadVolumes()
    }, [loadVolumes])

    return {volumes, loadVolumes, loading}
}