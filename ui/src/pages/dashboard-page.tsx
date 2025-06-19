import React, {useCallback, useEffect, useState} from 'react';
import {Box, CircularProgress, Paper, Typography, useTheme,} from '@mui/material';
import {CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis,} from 'recharts';
import {useClient} from '../lib/api.ts';
import {DockerService} from '../gen/docker/v1/docker_pb.ts';
import {useSnackbar} from '../components/snackbar';
import {callRPC} from '../lib/api';
import {ContainersTable} from '../components/containers-table';

// Original Interfaces from the prompt
// interface StatsResponse {
//     system: { CPU: number; memInBytes: bigint };
//     containers: ContainerStats[];
// }

export interface ContainerStats {
    id: string;
    name: string;
    cpuUsage: number;
    memoryUsage: bigint;
    memoryLimit: bigint;
    networkRx: bigint;
    networkTx: bigint;
    blockRead: bigint;
    blockWrite: bigint;
}

// Interface for a single point in our chart's history
// It now includes cumulative values to correctly calculate rates.
interface ChartDataPoint {
    timestamp: number;
    systemCpu: number;
    containerCpu: number;
    systemMem: number; // in MB
    containerMem: number; // in MB
    networkRxRate: number; // in MB/s
    networkTxRate: number; // in MB/s
    diskReadRate: number; // in MB/s
    diskWriteRate: number; // in MB/s
    // Cumulative values stored for next calculation
    cumulativeNetworkRx: bigint;
    cumulativeNetworkTx: bigint;
    cumulativeBlockRead: bigint;
    cumulativeBlockWrite: bigint;
}

// --- Helper Functions ---

const BYTES_IN_MB = 1024 * 1024;
const MAX_HISTORY_LENGTH = 30; // Number of data points to keep in history

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatRate = (bytesPerSecond: number) => {
    if (!bytesPerSecond || bytesPerSecond < 0) return '0 MB/s';
    return `${bytesPerSecond.toFixed(2)} MB/s`;
};

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({title}) => (
    <Paper
        sx={{
            p: 2,
            height: 300,
            display: 'flex',
            flexDirection: 'column',
            width: '100%', // <-- Add this line
        }}
    >
        <Typography variant="h6" component="h3" gutterBottom>
            {title}
        </Typography>
        <Box sx={{flexGrow: 1, minWidth: 0}}> {/* minWidth: 0 for the inner box as well */}
            {/*<ResponsiveContainer width="100%" height="100%">*/}
            {/*</ResponsiveContainer>*/}
        </Box>
    </Paper>
);

const timeTickFormatter = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

const CpuChart = ({data}: { data: ChartDataPoint[] }) => {
    const theme = useTheme();
    return (
        <ChartContainer title="CPU Usage">
            <LineChart width={500} height={250} data={data}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="timestamp" tickFormatter={timeTickFormatter} angle={-30} textAnchor="end" height={50}/>
                <YAxis unit="%" domain={[0, 100]}/>
                <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    labelFormatter={timeTickFormatter}
                />
                <Legend/>
                <Line type="monotone" dataKey="containerCpu" name="Containers" stroke={theme.palette.primary.main}
                      dot={false}/>
                <Line type="monotone" dataKey="systemCpu" name="System" stroke={theme.palette.secondary.main}
                      dot={false}/>
            </LineChart>
        </ChartContainer>
    );
};

const MemoryChart = ({data}: { data: ChartDataPoint[] }) => {
    const theme = useTheme();
    return (
        <ChartContainer title="Memory Usage">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="timestamp" tickFormatter={timeTickFormatter} angle={-30} textAnchor="end" height={50}/>
                <YAxis tickFormatter={(value) => formatBytes(value * BYTES_IN_MB, 0)}/>
                <Tooltip
                    formatter={(value: number) => formatBytes(value * BYTES_IN_MB)}
                    labelFormatter={timeTickFormatter}
                />
                <Legend/>
                <Line type="monotone" dataKey="containerMem" name="Containers" stroke={theme.palette.primary.main}
                      dot={false}/>
                <Line type="monotone" dataKey="systemMem" name="System" stroke={theme.palette.secondary.main}
                      dot={false}/>
            </LineChart>
        </ChartContainer>
    );
};

const NetworkIoChart = ({data}: { data: ChartDataPoint[] }) => (
    <ChartContainer title="Network I/O">
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="timestamp" tickFormatter={timeTickFormatter} angle={-30} textAnchor="end" height={50}/>
            <YAxis tickFormatter={val => `${val.toFixed(1)} MB/s`}/>
            <Tooltip
                formatter={(value: number) => formatRate(value)}
                labelFormatter={timeTickFormatter}
            />
            <Legend/>
            <Line type="monotone" dataKey="networkRxRate" name="Received" stroke="#8884d8" dot={false}/>
            <Line type="monotone" dataKey="networkTxRate" name="Transmitted" stroke="#82ca9d" dot={false}/>
        </LineChart>
    </ChartContainer>
);

const DiskIoChart = ({data}: { data: ChartDataPoint[] }) => (
    <ChartContainer title="Disk I/O">
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="timestamp" tickFormatter={timeTickFormatter} angle={-30} textAnchor="end" height={50}/>
            <YAxis tickFormatter={val => `${val.toFixed(1)} MB/s`}/>
            <Tooltip
                formatter={(value: number) => formatRate(value)}
                labelFormatter={timeTickFormatter}
            />
            <Legend/>
            <Line type="monotone" dataKey="diskReadRate" name="Read" stroke="#ffc658" dot={false}/>
            <Line type="monotone" dataKey="diskWriteRate" name="Write" stroke="#d0ed57" dot={false}/>
        </LineChart>
    </ChartContainer>
);

// --- Main Dashboard Component ---

export const DashboardPage = () => {
    const dockerClient = useClient(DockerService);
    const {showError} = useSnackbar();
    const [history, setHistory] = useState<ChartDataPoint[]>([]);
    const [containers, setContainers] = useState<ContainerStats[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        const {val, err} = await callRPC(() => dockerClient.stats({}));
        if (err) {
            showError(err);
            setLoading(false);
            return;
        }

        if (val) {
            const now = Date.now();

            const totalContainerCpu = val.containers.reduce((sum, c) => sum + c.cpuUsage, 0);
            const totalContainerMem = val.containers.reduce((sum, c) => sum + c.memoryUsage, 0n);
            const totalNetworkRx = val.containers.reduce((sum, c) => sum + c.networkRx, 0n);
            const totalNetworkTx = val.containers.reduce((sum, c) => sum + c.networkTx, 0n);
            const totalBlockRead = val.containers.reduce((sum, c) => sum + c.blockRead, 0n);
            const totalBlockWrite = val.containers.reduce((sum, c) => sum + c.blockWrite, 0n);

            setHistory(prevHistory => {
                const lastPoint = prevHistory.length > 0 ? prevHistory[prevHistory.length - 1] : null;

                let networkRxRate = 0, networkTxRate = 0, diskReadRate = 0, diskWriteRate = 0;

                if (lastPoint) {
                    const timeDeltaSeconds = (now - lastPoint.timestamp) / 1000;
                    if (timeDeltaSeconds > 0) {
                        const rxDelta = totalNetworkRx - lastPoint.cumulativeNetworkRx;
                        const txDelta = totalNetworkTx - lastPoint.cumulativeNetworkTx;
                        const readDelta = totalBlockRead - lastPoint.cumulativeBlockRead;
                        const writeDelta = totalBlockWrite - lastPoint.cumulativeBlockWrite;

                        networkRxRate = (Number(rxDelta) / BYTES_IN_MB) / timeDeltaSeconds;
                        networkTxRate = (Number(txDelta) / BYTES_IN_MB) / timeDeltaSeconds;
                        diskReadRate = (Number(readDelta) / BYTES_IN_MB) / timeDeltaSeconds;
                        diskWriteRate = (Number(writeDelta) / BYTES_IN_MB) / timeDeltaSeconds;
                    }
                }

                const newPoint: ChartDataPoint = {
                    timestamp: now,
                    systemCpu: val.system?.CPU || 0,
                    containerCpu: totalContainerCpu,
                    systemMem: Number(val.system?.memInBytes || 0n) / BYTES_IN_MB,
                    containerMem: Number(totalContainerMem) / BYTES_IN_MB,
                    networkRxRate: Math.max(0, networkRxRate), // Ensure rate is not negative
                    networkTxRate: Math.max(0, networkTxRate),
                    diskReadRate: Math.max(0, diskReadRate),
                    diskWriteRate: Math.max(0, diskWriteRate),
                    cumulativeNetworkRx: totalNetworkRx,
                    cumulativeNetworkTx: totalNetworkTx,
                    cumulativeBlockRead: totalBlockRead,
                    cumulativeBlockWrite: totalBlockWrite,
                };

                return [...prevHistory, newPoint].slice(-MAX_HISTORY_LENGTH);
            });

            setContainers(val.containers || []);
        }

        setLoading(false);
    }, [dockerClient, showError]);

    useEffect(() => {
        fetchStats().then();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (containers.length === 0 && history.length === 0) {
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
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3, // This replaces the Grid spacing prop
                    mb: 3,
                }}
            >
                {/* Each chart is wrapped in a Box with explicit width */}
                <Box sx={{width: {xs: '100%', lg: 'calc(50% - 12px)'}}}>
                    <CpuChart data={history}/>
                </Box>
                <Box sx={{width: {xs: '100%', lg: 'calc(50% - 12px)'}}}>
                    <MemoryChart data={history}/>
                </Box>
                <Box sx={{width: {xs: '100%', lg: 'calc(50% - 12px)'}}}>
                    <NetworkIoChart data={history}/>
                </Box>
                <Box sx={{width: {xs: '100%', lg: 'calc(50% - 12px)'}}}>
                    <DiskIoChart data={history}/>
                </Box>
            </Box>

            <ContainersTable containers={containers}/>
        </Box>
    );
};