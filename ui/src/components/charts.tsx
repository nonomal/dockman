import {useTheme} from '@mui/material';
import {ResponsiveLine} from "@nivo/line";

export interface DataPoint {
    x: number | string | Date;
    y: number | null;
}

export interface DataSeries {
    id: string | number;
    data: DataPoint[];
    color?: string;
}

export type NivoData = DataSeries[];

interface StatLineChartProps {
    data: NivoData;
    yFormat?: string;
    legend?: string;
}

export function StatLineChart({data, yFormat = " >-.2f", legend = "value"}: StatLineChartProps) {
    const theme = useTheme();

    // Best graph for this data is a time-series line chart
    return (
        <ResponsiveLine
            data={data}
            margin={{top: 20, right: 20, bottom: 60, left: 80}}
            xScale={{
                type: 'time',
                format: 'native', // Use native Date objects
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
                format: '%H:%M', // Show time on x-axis
                legend: 'Time',
                legendOffset: 36,
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
            theme={{
                axis: {
                    ticks: {
                        text: {
                            fill: theme.palette.text.secondary,
                        },
                    },
                    legend: {
                        text: {
                            fill: theme.palette.text.primary,
                        },
                    },
                },
                tooltip: {
                    container: {
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                    },
                },
                legends: {
                    text: {
                        fill: theme.palette.text.primary,
                    }
                }
            }}
            colors={{scheme: 'category10'}}
            pointSize={10}
            pointColor={{theme: 'background'}}
            pointBorderWidth={2}
            pointBorderColor={{from: 'serieColor'}}
            pointLabelYOffset={-12}
            useMesh={true}
            enableSlices="x"
            sliceTooltip={({slice}) => (
                <div style={{
                    background: theme.palette.background.paper,
                    padding: '9px 12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '4px',
                }}>
                    {slice.points.map(point => (
                        <div key={point.id} style={{
                            color: point.color,
                            padding: '3px 0',
                        }}>
                            <strong>{point.id}</strong>: {point.data.yFormatted}
                        </div>
                    ))}
                </div>
            )}
            legends={[
                {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 50,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 150,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                },
            ]}
        />
    );
}