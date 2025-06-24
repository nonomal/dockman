import {useCallback, useEffect, useState} from 'react';
import {Box, Fade, Typography,} from '@mui/material';
import {useClient} from '../lib/api.ts';
import {type ContainerStats, DockerService, ORDER, SORT_FIELD} from '../gen/docker/v1/docker_pb.ts';
import {useSnackbar} from '../hooks/snackbar.ts';
import {callRPC} from '../lib/api';
import {ContainerStatTable} from '../components/container-stat-table.tsx';
import EntertainingLoader from "../components/dashboard-loader.tsx";

export const DashboardPage = () => {
    const dockerClient = useClient(DockerService);
    const {showError} = useSnackbar();
    const [containers, setContainers] = useState<ContainerStats[]>([]);
    const [loading, setLoading] = useState(true);

    const [field, setField] = useState(SORT_FIELD.MEM);
    const [orderBy, setOrderBy] = useState(ORDER.DSC)

    const fetchStats = useCallback(async () => {
        const {val, err} = await callRPC(() => dockerClient.stats({sortBy: field, order: orderBy}));
        if (err) {
            showError(err);
            setLoading(false);
            return;
        }

        setContainers(val?.containers || [])
        setLoading(false);
    }, [dockerClient, field, orderBy]);

    useEffect(() => {
        fetchStats().then();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);
    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
            }}>
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
        <Fade in={true}>
            <Box sx={{p: 1.5, flexGrow: 1, overflow: 'auto'}}>
                {/*<ContainerStatChart containers={containers}/>*/}
                <ContainerStatTable order={orderBy} activeSortField={field} onFieldClick={(field, orderBy) => {
                    setField(field);
                    setOrderBy(orderBy);
                    fetchStats().then();
                }} containers={containers}/>
            </Box>
        </Fade>
    );
};