import {useCallback, useEffect, useState} from "react";
import {
    Box,
    CircularProgress,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import {callRPC, useClient} from "../lib/api.ts";
import {DockerService} from "../gen/docker/v1/docker_pb.ts";
import {useSnackbar} from "../components/snackbar.tsx";
import {trim} from "../lib/utils.ts";


export const DashboardPage = () => {
    const dockerClient = useClient(DockerService);
    const {showError} = useSnackbar();
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        // Don't set loading to true here on subsequent fetches to avoid screen flicker
        const {val, err} = await callRPC(() => dockerClient.stats({}));
        if (err) {
            showError(err);
        } else {

            if (val) {
                setStats({
                    system: {
                        CPU: val.system?.CPU || 0,
                        memInBytes: BigInt(val.system?.memInBytes || 0)
                    },
                    containers: (val.containers || [])
                });
            }
        }

        setLoading(false);
    }, [dockerClient, showError]);

    useEffect(() => {
        fetchStats().then();
        const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (!stats?.containers) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3}}>
                <Typography variant="h6" color="text.secondary">
                    No stats information found.
                </Typography>
            </Box>
        );
    }

    // Main dashboard content
    return (
        <Box sx={{p: 3, height: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
                <Typography variant="h4">
                    Docker Dashboard
                </Typography>
            </Box>

            <ContainersTable containers={stats.containers}/>
        </Box>
    );
};

interface StatsResponse {
    system: { CPU: number; memInBytes: bigint; };
    containers: ContainerStats[];
}

const formatBytes = (bytes: number | bigint, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
    return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface ContainerStats {
    id: string;
    name: string;
    cpuUsage: number; // percentage
    memoryUsage: bigint; // bytes
    memoryLimit: bigint; // bytes
    networkRx: bigint; // bytes
    networkTx: bigint; // bytes
    blockRead: bigint; // bytes
    blockWrite: bigint; // bytes
}

const ContainersTable = ({containers}: { containers: ContainerStats[] }) => {
    return (
        <TableContainer component={Paper} variant="outlined">
            <Table sx={{minWidth: 650}} aria-label="container stats table">
                <TableHead>
                    <TableRow sx={{'& th': {fontWeight: 'bold'}}}>
                        <TableCell>Container Name</TableCell>
                        <TableCell>Container ID</TableCell>
                        <TableCell sx={{width: '15%'}}>CPU %</TableCell>
                        <TableCell>Memory Usage / Limit</TableCell>
                        <TableCell>Network I/O (Rx/Tx)</TableCell>
                        <TableCell>Block I/O (Read/Write)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {containers.map((container) => {
                        const memUsagePercent = container.memoryLimit > 0 ? (Number(container.memoryUsage) / Number(container.memoryLimit)) * 100 : 0;
                        return (
                            <TableRow key={container.id} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                                <TableCell component="th" scope="row">
                                    {trim(container.name, "/")}
                                </TableCell>
                                <TableCell>{container.id.substring(0, 12)}</TableCell>
                                <TableCell>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Box sx={{width: '100%', mr: 1}}>
                                            <LinearProgress variant="determinate" value={container.cpuUsage}/>
                                        </Box>
                                        <Box sx={{minWidth: 35}}>
                                            <Typography variant="body2"
                                                        color="text.secondary">{`${container.cpuUsage.toFixed(2)}%`}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{`${formatBytes(Number(container.memoryUsage))} / ${formatBytes(Number(container.memoryLimit))} (${memUsagePercent.toFixed(1)}%)`}</TableCell>
                                <TableCell>{`${formatBytes(Number(container.networkRx))} / ${formatBytes(Number(container.networkTx))}`}</TableCell>
                                <TableCell>{`${formatBytes(Number(container.blockRead))} / ${formatBytes(Number(container.blockWrite))}`}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};