import type {ContainerStats} from "../gen/docker/v1/docker_pb.ts";
import {type NivoData, StatLineChart} from "./charts.tsx";
import {useEffect, useState} from "react";
import {Box, Card, CardContent, Typography} from "@mui/material";
import Grid from '@mui/material/Grid';

// limit the size of the history array
const MAX_HISTORY_LENGTH = 100;

interface ContainersChartProps {
    containers: ContainerStats[];
}

export function ContainersStatChart({containers}: ContainersChartProps) {
    // State to store historical data for charts
    const [history, setHistory] = useState<Record<string, Omit<ContainerStats, 'id' | 'name'> & {
        timestamp: Date
    }>[]>([]);

    useEffect(() => {
        if (containers) {
            // Create a new history entry with the current stats
            const newHistoryEntry: Record<string, Omit<ContainerStats, 'id' | 'name'> & { timestamp: Date }> = {};
            const timestamp = new Date();
            containers.forEach((c: ContainerStats) => {
                newHistoryEntry[c.name] = {...c, timestamp};
            });

            // Add the new entry to history and keep it within the max length
            setHistory(prev => [...prev, newHistoryEntry].slice(-MAX_HISTORY_LENGTH));
        }
    }, [containers])

    const transformData = (key: keyof Omit<ContainerStats, '$typeName' | '$unknown' | 'id' | 'name' | 'memoryLimit'>): NivoData => {
        const series: { [name: string]: { id: string, data: { x: Date, y: number }[] } } = {};

        history.forEach(entry => {
            Object.keys(entry).forEach(containerName => {
                if (!series[containerName]) {
                    series[containerName] = {id: containerName, data: []};
                }
                const containerData = entry[containerName];
                if (containerData) {
                    const value = containerData[key];
                    series[containerName].data.push({
                        x: containerData.timestamp,
                        // Convert bigint to number for charting
                        y: typeof value === 'bigint' ? Number(value) : value,
                    });
                }
            });
        });
        return Object.values(series);
    };

    const cpuData = transformData('cpuUsage');
    const memoryData = transformData('memoryUsage');
    const networkRxData = transformData('networkRx');
    const networkTxData = transformData('networkTx');
    const diskReadData = transformData('blockRead');
    const diskWriteData = transformData('blockWrite');

    const networkData = [...networkRxData.map(s => ({...s, id: `${s.id} Rx`})), ...networkTxData.map(s => ({
        ...s,
        id: `${s.id} Tx`
    }))]
    const diskData = [...diskReadData.map(s => ({...s, id: `${s.id} Read`})), ...diskWriteData.map(s => ({
        ...s,
        id: `${s.id} Write`
    }))]


    const charts = [
        {
            title: "CPU Usage (%)",
            chart: <StatLineChart data={cpuData} yFormat=">-.2f" legend="CPU %"/>
        },
        {
            title: "Memory Usage",
            chart: <StatLineChart data={memoryData} yFormat=">-.2s" legend="Bytes"/>

        },
        {
            title: "Network I/O",
            chart: <StatLineChart data={networkData} yFormat=">-.2s" legend="Bytes"/>

        },
        {
            title: "Disk I/O",
            chart: <StatLineChart data={diskData} yFormat=">-.2s" legend="Bytes"/>

        },
    ]

    return (
        <Grid container spacing={3} sx={{mb: 3}}>
            {
                charts.map((chart, index) => (
                    <Grid size={{xs: 12, md: 6}} key={index}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{chart.title}</Typography>
                                <Box sx={{height: 300, minWidth: 0}}>
                                    {chart.chart}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))
            }
        </Grid>
    )
}