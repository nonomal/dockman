import {
    Box,
    Fade,
    IconButton,
    LinearProgress,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Tooltip,
    Typography
} from "@mui/material";
import {type ContainerStats, ORDER, SORT_FIELD} from "../gen/docker/v1/docker_pb.ts";
import React, {useState} from "react";
import GetAppIcon from '@mui/icons-material/GetApp';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import {Article, ContentCopy} from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";


interface ContainersTableProps {
    activeSortField: SORT_FIELD;
    order: ORDER
    onFieldClick: (field: SORT_FIELD, orderBy: ORDER) => void;
    containers: ContainerStats[];
    loading: boolean;
}

export const ContainerStatTable = ({
                                       containers,
                                       onFieldClick,
                                       activeSortField,
                                       order,
                                       loading
                                   }: ContainersTableProps) => {
    const handleSortRequest = (field: SORT_FIELD) => {
        // If the same field is clicked again, toggle the order. Otherwise, default to DSC.
        const isAsc = activeSortField === field && order === ORDER.ASC;
        const newOrder = isAsc ? ORDER.DSC : ORDER.ASC;
        // If a new field is clicked, always start with DSC
        const finalOrder = activeSortField !== field ? ORDER.DSC : newOrder;
        onFieldClick(field, finalOrder);
    };

    const createSortableHeader = (field: SORT_FIELD, label: string, icon?: React.ReactNode) => (
        <TableSortLabel
            active={activeSortField === field}
            direction={order === ORDER.ASC ? 'asc' : 'desc'}
            onClick={() => handleSortRequest(field)}
        >
            <Box component="span" sx={{display: 'flex', alignItems: 'center'}}>
                {icon && (
                    <Box component="span" sx={{mr: 0.5, display: 'flex', alignItems: 'center'}}>
                        {icon}
                    </Box>
                )}
                {label}
            </Box>
        </TableSortLabel>
    );

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const handleCopy = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
        event.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        // After 1.5 seconds, reset the state to clear the checkmark
        setTimeout(() => {
            setCopiedId(null);
        }, 1500);
    };

    if (loading) {
        return (
            <TableContainer component={Paper} variant="outlined">
                <Table sx={{minWidth: 650}} aria-label="container stats table">
                    <TableHead>
                        <TableRow sx={{'& th': {fontWeight: 'bold'}}}>
                            <TableCell>
                                {createSortableHeader(SORT_FIELD.NAME, 'Container Name')}
                            </TableCell>
                            <TableCell sx={{width: '15%'}}>
                                {createSortableHeader(SORT_FIELD.CPU, 'CPU %')}
                            </TableCell>
                            <TableCell>
                                {createSortableHeader(SORT_FIELD.MEM, 'Memory Usage / Limit')}
                            </TableCell>
                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Typography variant="body2" sx={{fontWeight: 'bold', mr: 1}}>
                                        Network:
                                    </Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        {createSortableHeader(SORT_FIELD.NETWORK_RX, "Rx",
                                            <GetAppIcon fontSize="small"/>)
                                        }
                                        <Typography component="span" sx={{mx: 0.5}}>/</Typography>
                                        {createSortableHeader(SORT_FIELD.NETWORK_TX, "Tx",
                                            <PublishIcon fontSize="small"/>)
                                        }
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Typography variant="body2" sx={{fontWeight: 'bold', mr: 1}}>
                                        Block I/O:
                                    </Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        {createSortableHeader(SORT_FIELD.DISK_R, "Read", <Article fontSize="small"/>)}
                                        <Typography component="span" sx={{mx: 0.5}}>/</Typography>
                                        {createSortableHeader(SORT_FIELD.DISK_W, "Write", <EditIcon fontSize="small"/>)}
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[...Array(5)].map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton animation="wave"/></TableCell>
                                <TableCell><Skeleton animation="wave" variant="rounded" width={80}
                                                     height={24}/></TableCell>
                                <TableCell><Skeleton animation="wave"/></TableCell>
                                <TableCell><Skeleton animation="wave"/></TableCell>
                                <TableCell align="right"><Skeleton animation="wave" variant="circular" width={24}
                                                                   height={24}/></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    return (
        <Fade in={true} timeout={400}>
            <TableContainer component={Paper} variant="outlined">
                <Table sx={{minWidth: 650}} aria-label="container stats table">
                    <TableHead>
                        <TableRow sx={{'& th': {fontWeight: 'bold'}}}>
                            <TableCell>
                                {createSortableHeader(SORT_FIELD.NAME, 'Container Name')}
                            </TableCell>
                            <TableCell sx={{width: '15%'}}>
                                {createSortableHeader(SORT_FIELD.CPU, 'CPU %')}
                            </TableCell>
                            <TableCell>
                                {createSortableHeader(SORT_FIELD.MEM, 'Memory Usage / Limit')}
                            </TableCell>
                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Typography variant="body2" sx={{fontWeight: 'bold', mr: 1}}>
                                        Network:
                                    </Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        {createSortableHeader(SORT_FIELD.NETWORK_RX, "Rx",
                                            <GetAppIcon fontSize="small"/>)
                                        }
                                        <Typography component="span" sx={{mx: 0.5}}>/</Typography>
                                        {createSortableHeader(SORT_FIELD.NETWORK_TX, "Tx",
                                            <PublishIcon fontSize="small"/>)
                                        }
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Typography variant="body2" sx={{fontWeight: 'bold', mr: 1}}>
                                        Block I/O:
                                    </Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        {createSortableHeader(SORT_FIELD.DISK_R, "Read", <Article fontSize="small"/>)}
                                        <Typography component="span" sx={{mx: 0.5}}>/</Typography>
                                        {createSortableHeader(SORT_FIELD.DISK_W, "Write", <EditIcon fontSize="small"/>)}
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {containers.map((container) => {
                            const memUsagePercent = container.memoryLimit > 0 ? (Number(container.memoryUsage) / Number(container.memoryLimit)) * 100 : 0;
                            return (
                                <TableRow key={container.id} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                                    <TableCell component="th" scope="row">
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                            <span>{container.name}</span>
                                            <Tooltip title={copiedId === container.id ? "Copied!" : "Copy container ID"}
                                                     placement="top">
                                                <IconButton
                                                    onClick={(e) => handleCopy(e, container.id)}
                                                    size="small"
                                                    sx={{position: 'relative'}}
                                                >
                                                    {/* The check icon is only visible when its ID is the copiedId */}
                                                    <CheckIcon
                                                        fontSize="inherit"
                                                        sx={{
                                                            position: 'absolute',
                                                            opacity: copiedId === container.id ? 1 : 0,
                                                            transition: 'opacity 0.2s',
                                                            color: 'success.main' // Give it a green color
                                                        }}
                                                    />
                                                    {/* The copy icon is visible by default and fades out when copied */}
                                                    <ContentCopy
                                                        fontSize="inherit"
                                                        sx={{
                                                            opacity: copiedId === container.id ? 0 : 1,
                                                            transition: 'opacity 0.2s',
                                                        }}
                                                    />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
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
        </Fade>
    );
};

const formatBytes = (bytes: number | bigint, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
    return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
