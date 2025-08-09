import {Box} from '@mui/material';
import {useDockerStats} from "../../hooks/docker-containers-stats.ts";
import {ContainerStatTable} from './components/container-stat-table.tsx';

interface StackStatsProps {
    selectedPage: string;
}

export function TabStat({selectedPage}: StackStatsProps) {
    const {containers, loading, handleSortChange, sortOrder, sortField} = useDockerStats(selectedPage)

    return (
        <Box sx={{p: 3, flexGrow: 1}}>
            {containers.length !== 0 ?
                <></> : // todo charts
                // <ContainerStatChart containers={containers}/> :
                <></>
            }
            {/*<ContainerAggregatesGrid containers={containers}/>*/}
            <ContainerStatTable
                loading={loading}
                containers={containers}
                activeSortField={sortField}
                order={sortOrder}
                onFieldClick={handleSortChange}/>
        </Box>
    );
}