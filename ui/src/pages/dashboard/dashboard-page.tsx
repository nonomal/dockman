import {Box,} from '@mui/material'
import {useDockerStats} from "../../hooks/docker-container-stats.ts"
import {ContainerStatTable} from "../compose/components/container-stat-table.tsx"

export const DashboardPage = () => {
    const {containers, loading, handleSortChange, sortOrder, sortField} = useDockerStats()

    return (
        // <Fade in={true} timeout={0}>
        <Box sx={{p: 1.5, flexGrow: 1, overflow: 'auto'}}>
            {containers.length !== 0 ?
                <></> : // todo charts
                // <ContainerStatChart containers={containers}/> :
                <></>
            }
            {/*<ContainerAggregatesGrid containers={containers}/>*/}
            <ContainerStatTable
                loading={loading}
                order={sortOrder}
                activeSortField={sortField}
                onFieldClick={handleSortChange}
                containers={containers}
            />
        </Box>
        // </Fade>
    )
}