import {Box} from '@mui/material';
import {ContainerStatTable} from "../components/container-stat-table.tsx";
import {useDockerStats} from "../hooks/container-stats.ts";
import {ContainerStatChart} from "../components/container-stat-chart.tsx";

interface StackStatsProps {
    selectedPage: string;
}

export function StatStacksPage({selectedPage}: StackStatsProps) {
    const {containers, loading, modifySort, orderBy, field} = useDockerStats(selectedPage)

    return (
        <Box sx={{p: 3, flexGrow: 1}}>
            {containers.length !== 0 ?
                <ContainerStatChart containers={containers}/> :
                <></>
            }
            <ContainerStatTable
                loading={loading}
                containers={containers}
                activeSortField={field}
                order={orderBy}
                onFieldClick={modifySort}/>
        </Box>
    );
}