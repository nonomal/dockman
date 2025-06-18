import {
    Box,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import {formatBytes, trim} from "../lib/utils.ts";
import type {ContainerStats} from "../pages/dashboard-page.tsx";

export const ContainersTable = ({containers}: { containers: ContainerStats[] }) => {
    return (
        <TableContainer component={Paper} variant="outlined">
            <Table sx={{minWidth: 650}} aria-label="container stats table">
                <TableHead>
                    <TableRow sx={{'& th': {fontWeight: 'bold'}}}>
                        <TableCell>Container Name</TableCell>
                        <TableCell>Container ID</TableCell>
                        <TableCell sx={{width: '15%'}}>CPU %</TableCell>
                        <TableCell>Memory Usage / Limit</TableCell>
                        <TableCell>Network I/O (Rx/Tx)</TableCell>
                        <TableCell>Block I/O (Read/Write)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {containers.map((container) => {
                        const memUsagePercent = container.memoryLimit > 0 ? (Number(container.memoryUsage) / Number(container.memoryLimit)) * 100 : 0;
                        return (
                            <TableRow key={container.id} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                                <TableCell component="th" scope="row">
                                    {trim(container.name, "/")}
                                </TableCell>
                                <TableCell>{container.id.substring(0, 12)}</TableCell>
                                <TableCell>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Box sx={{width: '100%', mr: 1}}>
                                            <LinearProgress variant="determinate" value={container.cpuUsage}/>
                                        </Box>
                                        <Box sx={{minWidth: 35}}>
                                            <Typography variant="body2"
                                                        color="text.secondary">{`${container.cpuUsage.toFixed(2)}%`}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{`${formatBytes(Number(container.memoryUsage))} / ${formatBytes(Number(container.memoryLimit))} (${memUsagePercent.toFixed(1)}%)`}</TableCell>
                                <TableCell>{`${formatBytes(Number(container.networkRx))} / ${formatBytes(Number(container.networkTx))}`}</TableCell>
                                <TableCell>{`${formatBytes(Number(container.blockRead))} / ${formatBytes(Number(container.blockWrite))}`}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
