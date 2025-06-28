import {Box, Fade,} from '@mui/material';
import {ContainerStatTable} from '../components/container-stat-table.tsx';
import {useDockerStats} from "../hooks/container-stats.ts";

export const DashboardPage = () => {
    const {containers, loading, modifySort, orderBy, field} = useDockerStats()

    return (
        <Fade in={true}>
            <Box sx={{p: 1.5, flexGrow: 1, overflow: 'auto'}}>
                {/*<ContainerStatChart containers={containers}/>*/}
                <ContainerStatTable
                    loading={loading}
                    order={orderBy}
                    activeSortField={field}
                    onFieldClick={modifySort}
                    containers={containers}
                />
            </Box>
        </Fade>
    );
};