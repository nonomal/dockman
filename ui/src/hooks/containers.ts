import {useCallback, useEffect, useState} from 'react';
import {callRPC, useClient} from '../lib/api.ts';
import {type ContainerList, DockerService} from '../gen/docker/v1/docker_pb.ts';
import {useSnackbar} from "./snackbar.ts";

export function useDockerContainers(selectedPage: string) {
    const dockerService = useClient(DockerService);
    const [containers, setContainers] = useState<ContainerList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const {showWarning} = useSnackbar()

    const fetchContainers = useCallback(async () => {
        if (!selectedPage) {
            setContainers([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const {val, err} = await callRPC(() => dockerService.list({filename: selectedPage}));
        if (err) {
            showWarning(`Failed to refresh containers: ${err}`);
            setContainers([]);
        } else {
            setContainers(val?.list || []);
        }
        setIsLoading(false);
    }, [dockerService, selectedPage]);

    useEffect(() => {
        fetchContainers().then();
        const intervalId = setInterval(fetchContainers, 5000);
        return () => clearInterval(intervalId);
    }, [fetchContainers]);

    return {containers, isLoading, refresh: fetchContainers};
}