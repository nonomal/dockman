// src/components/ContainerTable.tsx
import React from 'react';
import {
    Box,
    Chip,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import {PlayArrow as PlayArrowIcon} from '@mui/icons-material';
import {type ContainerList, type Port} from '../gen/docker/v1/docker_pb.ts';
import {getImageHomePageUrl, getStatusChipColor, trim} from '../lib/utils.ts';
import {ContainerPort} from './container-port.tsx';

interface ContainerTableProps {
    containers: ContainerList[];
    onShowLogs: (containerId: string, containerName: string) => void;
}

const tableHeaderStyles = {fontWeight: 'bold', backgroundColor: 'background.paper'};

const formatPorts = (ports: Port[]) => {
    if (!ports || ports.length === 0) return <>—</>;
    return (
        <>
            {ports.map((port, index) => (
                <React.Fragment key={`${port.host}-${port.public}-${port.private}-${port.type}`}>
                    <ContainerPort port={port}/>
                    {index < ports.length - 1 && ', '}
                </React.Fragment>
            ))}
        </>
    );
};

export function ContainerTable({containers, onShowLogs}: ContainerTableProps) {
    if (containers.length === 0) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                <Typography variant="h5" color="text.secondary">
                    No containers found for this deployment
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} sx={{flexGrow: 1, boxShadow: 3, borderRadius: 2}}>
            <Table stickyHeader aria-label="docker containers table">
                <TableHead>
                    <TableRow>
                        <TableCell sx={tableHeaderStyles}>Name</TableCell>
                        <TableCell sx={tableHeaderStyles}>Status</TableCell>
                        <TableCell sx={tableHeaderStyles}>Image</TableCell>
                        <TableCell sx={tableHeaderStyles}>Ports</TableCell>
                        <TableCell sx={tableHeaderStyles}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {containers.map((container) => (
                        <TableRow hover key={container.id} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                            <TableCell component="th" scope="row">
                                <Typography variant="body1" fontWeight="500">{trim(container.name, "/")}</Typography>
                            </TableCell>
                            <TableCell>
                                <Chip label={container.status} color={getStatusChipColor(container.status)} size="small"
                                      sx={{textTransform: 'capitalize'}}/>
                            </TableCell>

                            <TableCell>
                                <Tooltip title="Open image website" arrow>
                                    <Link
                                        href={getImageHomePageUrl(container.imageName)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{textDecoration: 'none', color: 'primary.main'}}
                                    >
                                        <Typography
                                            variant="body2"
                                            component="span"
                                            sx={{
                                                wordBreak: 'break-all',
                                                // The hover effect is still good here
                                                '&:hover': {textDecoration: 'underline'}
                                            }}
                                        >
                                            {container.imageName}
                                        </Typography>
                                    </Link>
                                </Tooltip>
                            </TableCell>
                            <TableCell width={360}>
                                {formatPorts(container.ports)}
                            </TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Show container logs">
                                        <PlayArrowIcon
                                            aria-label="start container"
                                            color="success"
                                            onClick={() => onShowLogs(container.id, trim(container.name, "/"))}
                                            sx={{cursor: 'pointer'}}
                                        />
                                    </Tooltip>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}