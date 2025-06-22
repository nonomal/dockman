import {useCallback, useEffect, useState} from 'react';
import {Box, Typography} from '@mui/material';
import {callRPC, useClient} from '../lib/api';
import {type ContainerStats, DockerService, ORDER, SORT_FIELD} from '../gen/docker/v1/docker_pb';
import {useSnackbar} from "../hooks/snackbar.ts";
import EntertainingLoader from "../components/dashboard-loader.tsx";
import {ContainersStatTable} from "../components/containers-stat-table.tsx";


interface StackStatsProps {
    selectedPage: string;
}

export function StatStacksPage({selectedPage}: StackStatsProps) {
    const dockerClient = useClient(DockerService);
    const {showError} = useSnackbar();

    const [containers, setContainers] = useState<ContainerStats[]>([]);
    const [loading, setLoading] = useState(true);

    const [field, setField] = useState(SORT_FIELD.MEM);
    const [orderBy, setOrderBy] = useState(ORDER.DSC)

    const fetchStats = useCallback(async () => {
        const {val, err} = await callRPC(() => dockerClient.stats({
            file: {filename: selectedPage},
            sortBy: field,
            order: orderBy,
        }));
        if (err) {
            showError(err);
            setLoading(false);
            return;
        }

        setContainers(val?.containers || []);
        setLoading(false);
    }, [dockerClient, field, orderBy, selectedPage]);

    useEffect(() => {
        fetchStats().then();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <EntertainingLoader/>
            </Box>
        );
    }

    if (containers.length === 0 || history.length === 0) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3}}>
                <Typography variant="h6" color="text.secondary">
                    No container stats found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{p: 3, flexGrow: 1}}>
            {/*<ContainersStatChart containers={containers}/>*/}
            <ContainersStatTable
                containers={containers}
                activeSortField={field}
                order={orderBy}
                onFieldClick={function (field: SORT_FIELD, orderBy: ORDER): void {
                    setField(field);
                    setOrderBy(orderBy);
                    fetchStats().then();
                }}/>
        </Box>
    );
}