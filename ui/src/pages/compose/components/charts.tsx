import {useTheme} from '@mui/material';
import {ResponsiveLine} from "@nivo/line";
import {memo, useMemo} from 'react';
import type {ChartSerie} from "./container-stat-chart.tsx";

// Using Nivo's exported 'Serie' type is a good practice.
// Renaming to NivoData for consistency with the parent component.
export type NivoData = ChartSerie[];

interface StatLineChartProps {
    data: NivoData;
    yFormat?: string;
    legend?: string;
}

export const StatLineChart = memo(
    function StatLineChart({
                               data,
                               yFormat = " >-.2s", // Changed default to be more general (e.g., for bytes)
                               legend = "value"
                           }: StatLineChartProps) {
        const theme = useTheme();

        const nivoTheme = useMemo(() => ({
            axis: {
                ticks: {
                    text: {
                        fill: theme.palette.text.secondary,
                        fontSize: 12,
                    },
                },
                legend: {
                    text: {
                        fill: theme.palette.text.primary,
                        fontSize: 14,
                        fontWeight: 'bold',
                    },
                },
            },
            tooltip: {
                container: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '4px',
                },
            },
            legends: {
                text: {
                    fill: theme.palette.text.primary,
                }
            },
            crosshair: {
                line: {
                    stroke: theme.palette.divider,
                    strokeWidth: 1,
                    strokeOpacity: 0.75,
                },
            },
        }), [theme]);

        return (
            <ResponsiveLine
                data={data}
                theme={nivoTheme}
                margin={{top: 20, right: 20, bottom: 60, left: 70}}
                xScale={{
                    type: 'time',
                    format: 'native',
                    precision: 'second',
                }}
                xFormat="time:%Y-%m-%d %H:%M:%S"
                yScale={{
                    type: 'linear',
                    min: 'auto',
                    max: 'auto',
                    stacked: false,
                    reverse: false,
                }}
                yFormat={yFormat}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    format: '%H:%M', // Keep the concise time format
                    legend: 'Time',
                    legendOffset: 45,
                    legendPosition: 'middle',
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    format: yFormat,
                    legend: legend,
                    legendOffset: -60,
                    legendPosition: 'middle',
                }}
                colors={{scheme: 'category10'}}
                pointSize={6}
                pointColor={{theme: 'background'}}
                pointBorderWidth={2}
                pointBorderColor={{from: 'serieColor'}}
                useMesh={true}
                enableSlices="x"
                legends={[
                    {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 60, // Increased offset to not overlap with axis legend
                        itemsSpacing: 10, // Added spacing between items
                        itemDirection: 'left-to-right',
                        itemWidth: 120, // Adjusted width
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemOpacity: 1, // Full opacity on hover
                                },
                            },
                        ],
                    },
                ]}
            />
        );
    });