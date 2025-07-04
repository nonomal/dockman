import {Box} from '@mui/material';
import {ContainerStatTable} from "../components/container-stat-table.tsx";
import {useDockerStats} from "../hooks/container-stats.ts";

interface StackStatsProps {
    selectedPage: string;
}

export function StatStacksPage({selectedPage}: StackStatsProps) {
    const {containers, loading, handleSortChange, sortOrder, sortField} = useDockerStats(selectedPage)
    
    return (
        <Box sx={{p: 3, flexGrow: 1}}>
            {containers.length !== 0 ?
                <></> : // todo charts
                // <ContainerStatChart containers={containers}/> :
                <></>
            }
            <ContainerStatTable
                loading={loading}
                containers={containers}
                activeSortField={sortField}
                order={sortOrder}
                onFieldClick={handleSortChange}/>
        </Box>
    );
}