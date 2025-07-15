import {useEffect, useMemo, useState} from "react";
import {Box, Card, CardContent, Typography} from "@mui/material";
import Grid from '@mui/material/Grid';
import type {ContainerStats} from "../../../gen/docker/v1/docker_pb.ts";
import {StatLineChart} from "../../../components/charts.tsx";

const MAX_HISTORY_LENGTH = 100;

type StatPoint = Omit<ContainerStats, 'id' | 'name'> & { timestamp: Date };
type HistoryByContainer = Record<string, StatPoint[]>;

export type ChartSerie = {
    id: string;
    data: { x: Date; y: number }[];
};

interface ContainerStatChartProps {
    containers: ContainerStats[];
}

export function ContainerStatChart({containers}: ContainerStatChartProps) {
    const [historyByContainer, setHistoryByContainer] = useState<HistoryByContainer>({});

    useEffect(() => {
        const timestamp = new Date();
        setHistoryByContainer(prevHistory => {
            const newHistory = {...prevHistory};
            const activeContainers = new Set<string>();

            for (const c of containers) {
                activeContainers.add(c.name);
                const statPoint: StatPoint = {...c, timestamp};
                const containerHistory = newHistory[c.name] || [];
                newHistory[c.name] = [...containerHistory, statPoint].slice(-MAX_HISTORY_LENGTH);
            }

            for (const containerName in newHistory) {
                if (!activeContainers.has(containerName)) {
                    delete newHistory[containerName];
                }
            }

            return newHistory;
        });
    }, [containers]);

    const {cpuData, memoryData, networkData, diskData} = useMemo(() => {
        const series: Record<string, ChartSerie> = {};

        const ensureSeries = (name: string): ChartSerie => {
            if (!series[name]) {
                series[name] = {id: name, data: []};
            }
            return series[name];
        };

        for (const containerName in historyByContainer) {
            const containerHistory = historyByContainer[containerName];

            const cpuSeries = ensureSeries(`${containerName}-cpu`);
            const memSeries = ensureSeries(`${containerName}-mem`);
            const netRxSeries = ensureSeries(`${containerName}-netRx`);
            const netTxSeries = ensureSeries(`${containerName}-netTx`);
            const diskReadSeries = ensureSeries(`${containerName}-diskRead`);
            const diskWriteSeries = ensureSeries(`${containerName}-diskWrite`);

            for (const point of containerHistory) {
                const x = point.timestamp;
                const y = (val: number | bigint) => typeof val === 'bigint' ? Number(val) : val;

                cpuSeries.data.push({x, y: point.cpuUsage});
                memSeries.data.push({x, y: y(point.memoryUsage)});
                netRxSeries.data.push({x, y: y(point.networkRx)});
                netTxSeries.data.push({x, y: y(point.networkTx)});
                diskReadSeries.data.push({x, y: y(point.blockRead)});
                diskWriteSeries.data.push({x, y: y(point.blockWrite)});
            }
        }

        const cpuData = Object.values(series).filter(s => s.id.endsWith('-cpu')).map(s => ({
            ...s,
            id: s.id.replace('-cpu', '')
        }));
        const memoryData = Object.values(series).filter(s => s.id.endsWith('-mem')).map(s => ({
            ...s,
            id: s.id.replace('-mem', '')
        }));

        const networkRxData = Object.values(series).filter(s => s.id.endsWith('-netRx')).map(s => ({
            ...s,
            id: `${s.id.replace('-netRx', '')} Rx`
        }));
        const networkTxData = Object.values(series).filter(s => s.id.endsWith('-netTx')).map(s => ({
            ...s,
            id: `${s.id.replace('-netTx', '')} Tx`
        }));

        const diskReadData = Object.values(series).filter(s => s.id.endsWith('-diskRead')).map(s => ({
            ...s,
            id: `${s.id.replace('-diskRead', '')} Read`
        }));
        const diskWriteData = Object.values(series).filter(s => s.id.endsWith('-diskWrite')).map(s => ({
            ...s,
            id: `${s.id.replace('-diskWrite', '')} Write`
        }));

        return {
            cpuData,
            memoryData,
            networkData: [...networkRxData, ...networkTxData],
            diskData: [...diskReadData, ...diskWriteData],
        };
    }, [historyByContainer]);

    const charts = useMemo(() => [
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
    ], [cpuData, memoryData, networkData, diskData]);

    return (
        <Grid container spacing={3} sx={{mb: 3}}>
            {charts.map((chart, index) => (
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
            ))}
        </Grid>
    );
}
