import {Box, Card, CardContent, CircularProgress, LinearProgress, Typography} from "@mui/material";
import React from "react";
import {Memory, NetworkCheck, Speed, Storage, TrendingDown, TrendingUp} from "@mui/icons-material";
import {type ContainerStats} from "../../../gen/docker/v1/docker_pb";
import {formatBytes, getUsageColor} from "../../../lib/editor.ts";

interface AggregateStatsProps {
    containers: ContainerStats[];
    loading?: boolean;
}

const formatBytesPerSecond = (bytes: number) => {
    return `${formatBytes(bytes)}`;
};

// Individual aggregate component for CPU
export function CPUAggregateCard({containers, loading}: AggregateStatsProps) {
    const cpuStats = React.useMemo(() => {
        if (containers.length === 0) return {avg: 0, max: 0, total: 0, count: 0};

        const cpuValues = containers.map(c => c.cpuUsage);
        const total = cpuValues.reduce((sum, cpu) => sum + cpu, 0);
        const avg = total / containers.length;
        const max = Math.max(...cpuValues);

        return {avg, max, total, count: containers.length};
    }, [containers]);

    const avgColor = getUsageColor(cpuStats.avg);
    const maxColor = getUsageColor(cpuStats.max);

    return (
        <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <CardContent sx={{flexGrow: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Speed sx={{mr: 1, color: 'primary.main'}}/>
                    <Typography variant="h6" component="div">
                        CPU Usage
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                        <CircularProgress/>
                    </Box>
                ) : (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {/* Average CPU */}
                        <Box>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                                <Typography variant="body2" color="text.secondary">
                                    Average
                                </Typography>
                                <Typography variant="body2" sx={{color: avgColor, fontWeight: 'bold'}}>
                                    {cpuStats.avg.toFixed(1)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(cpuStats.avg, 100)}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: avgColor,
                                        borderRadius: 4,
                                    }
                                }}
                            />
                        </Box>

                        {/* Peak CPU */}
                        <Box>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                                <Typography variant="body2" color="text.secondary">
                                    Peak
                                </Typography>
                                <Typography variant="body2" sx={{color: maxColor, fontWeight: 'bold'}}>
                                    {cpuStats.max.toFixed(1)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(cpuStats.max, 100)}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: maxColor,
                                        borderRadius: 4,
                                    }
                                }}
                            />
                        </Box>

                        {/* Container count */}
                        <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center'}}>
                            {cpuStats.count} container{cpuStats.count !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// Individual aggregate component for Memory
export function MemoryAggregateCard({containers, loading}: AggregateStatsProps) {
    const memoryStats = React.useMemo(() => {
        if (containers.length === 0) return {
            totalUsage: 0,
            totalLimit: 0,
            avgUsage: 0,
            avgLimit: 0,
            percentage: 0,
            count: 0
        };

        const totalUsage = containers.reduce((sum, c) => sum + Number(c.memoryUsage), 0);
        const totalLimit = containers.reduce((sum, c) => sum + Number(c.memoryLimit), 0);
        const avgUsage = totalUsage / containers.length;
        const avgLimit = totalLimit / containers.length;
        const percentage = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

        return {
            totalUsage,
            totalLimit,
            avgUsage,
            avgLimit,
            percentage,
            count: containers.length
        };
    }, [containers]);

    const usageColor = getUsageColor(memoryStats.percentage);

    return (
        <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <CardContent sx={{flexGrow: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Memory sx={{mr: 1, color: 'primary.main'}}/>
                    <Typography variant="h6" component="div">
                        Memory Usage
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                        <CircularProgress/>
                    </Box>
                ) : (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {/* Total Memory Usage */}
                        <Box>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                                <Typography variant="body2" color="text.secondary">
                                    Total Usage
                                </Typography>
                                <Typography variant="body2" sx={{color: usageColor, fontWeight: 'bold'}}>
                                    {memoryStats.percentage.toFixed(1)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(memoryStats.percentage, 100)}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: usageColor,
                                        borderRadius: 4,
                                    }
                                }}
                            />
                        </Box>

                        {/* Memory Details */}
                        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                            <Typography variant="caption" color="text.secondary">
                                Used: {formatBytes(memoryStats.totalUsage)}{' '}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total: {formatBytes(memoryStats.totalLimit)}
                            </Typography>
                        </Box>

                        {/* Average per container */}
                        <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center'}}>
                            Avg per container: {formatBytes(memoryStats.avgUsage)}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center'}}>
                            {memoryStats.count} container{memoryStats.count !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// Individual aggregate component for Network
export function NetworkAggregateCard({containers, loading}: AggregateStatsProps) {
    const networkStats = React.useMemo(() => {
        if (containers.length === 0) return {
            totalRx: 0,
            totalTx: 0,
            avgRx: 0,
            avgTx: 0,
            count: 0
        };

        const totalRx = containers.reduce((sum, c) => sum + Number(c.networkRx), 0);
        const totalTx = containers.reduce((sum, c) => sum + Number(c.networkTx), 0);
        const avgRx = totalRx / containers.length;
        const avgTx = totalTx / containers.length;

        return {totalRx, totalTx, avgRx, avgTx, count: containers.length};
    }, [containers]);

    return (
        <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <CardContent sx={{flexGrow: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <NetworkCheck sx={{mr: 1, color: 'primary.main'}}/>
                    <Typography variant="h6" component="div">
                        Network I/O
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                        <CircularProgress/>
                    </Box>
                ) : (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {/* Download (Rx) */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <TrendingDown sx={{color: 'success.main', fontSize: 16}}/>
                            <Box sx={{flexGrow: 1}}>
                                <Typography variant="body2" color="text.secondary">
                                    Download (Rx)
                                </Typography>
                                <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                                    {formatBytesPerSecond(networkStats.totalRx)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Upload (Tx) */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <TrendingUp sx={{color: 'warning.main', fontSize: 16}}/>
                            <Box sx={{flexGrow: 1}}>
                                <Typography variant="body2" color="text.secondary">
                                    Upload (Tx)
                                </Typography>
                                <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                                    {formatBytesPerSecond(networkStats.totalTx)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Average per container */}
                        <Box sx={{pt: 1, borderTop: 1, borderColor: 'divider'}}>
                            <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                                Avg Rx per container: {formatBytesPerSecond(networkStats.avgRx)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                                Avg Tx per container: {formatBytesPerSecond(networkStats.avgTx)}
                            </Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center'}}>
                            {networkStats.count} container{networkStats.count !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// Individual aggregate component for Disk I/O
export function DiskAggregateCard({containers, loading}: AggregateStatsProps) {
    const diskStats = React.useMemo(() => {
        if (containers.length === 0) return {
            totalRead: 0,
            totalWrite: 0,
            avgRead: 0,
            avgWrite: 0,
            count: 0
        };

        const totalRead = containers.reduce((sum, c) => sum + Number(c.blockRead), 0);
        const totalWrite = containers.reduce((sum, c) => sum + Number(c.blockWrite), 0);
        const avgRead = totalRead / containers.length;
        const avgWrite = totalWrite / containers.length;

        return {totalRead, totalWrite, avgRead, avgWrite, count: containers.length};
    }, [containers]);

    return (
        <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <CardContent sx={{flexGrow: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Storage sx={{mr: 1, color: 'primary.main'}}/>
                    <Typography variant="h6" component="div">
                        Disk I/O
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                        <CircularProgress/>
                    </Box>
                ) : (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {/* Read */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <TrendingDown sx={{color: 'info.main', fontSize: 16}}/>
                            <Box sx={{flexGrow: 1}}>
                                <Typography variant="body2" color="text.secondary">
                                    Read
                                </Typography>
                                <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                                    {formatBytesPerSecond(diskStats.totalRead)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Write */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <TrendingUp sx={{color: 'secondary.main', fontSize: 16}}/>
                            <Box sx={{flexGrow: 1}}>
                                <Typography variant="body2" color="text.secondary">
                                    Write
                                </Typography>
                                <Typography variant="body1" sx={{fontWeight: 'bold'}}>
                                    {formatBytesPerSecond(diskStats.totalWrite)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Average per container */}
                        <Box sx={{pt: 1, borderTop: 1, borderColor: 'divider'}}>
                            <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                                Avg Read per container: {formatBytesPerSecond(diskStats.avgRead)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                                Avg Write per container: {formatBytesPerSecond(diskStats.avgWrite)}
                            </Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center'}}>
                            {diskStats.count} container{diskStats.count !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// todo
// // Combined aggregate dashboard component
// export function ContainerAggregatesGrid({containers, loading}: AggregateStatsProps) {
//     return (
//         <Grid container spacing={2} sx={{mb: 3}}>
//             <Grid item xs={12} sm={6} md={3}>
//                 <CPUAggregateCard containers={containers} loading={loading}/>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//                 <MemoryAggregateCard containers={containers} loading={loading}/>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//                 <NetworkAggregateCard containers={containers} loading={loading}/>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//                 <DiskAggregateCard containers={containers} loading={loading}/>
//             </Grid>
//         </Grid>
//     );
// }