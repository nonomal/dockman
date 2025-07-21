import {
    Box,
    CircularProgress,
    Fade,
    IconButton,
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
    Typography,
    useTheme
} from "@mui/material"
import React, {useState} from "react"
import GetAppIcon from '@mui/icons-material/GetApp'
import PublishIcon from '@mui/icons-material/Publish'
import EditIcon from '@mui/icons-material/Edit'
import {Article, ContentCopy} from "@mui/icons-material"
import CheckIcon from "@mui/icons-material/Check"
import {type ContainerStats, ORDER, SORT_FIELD} from "../../../gen/docker/v1/docker_pb"


interface ContainersTableProps {
    activeSortField: SORT_FIELD
    order: ORDER
    onFieldClick: (field: SORT_FIELD, orderBy: ORDER) => void
    containers: ContainerStats[]
    placeHolders?: number
    loading: boolean
}

// Determines the color based on resource usage percentage.
// - Green for normal usage (< 70%)
// - Yellow for high usage (70-90%)
// - Red for critical usage (> 90%)
const getUsageColor = (value: number): 'success.main' | 'warning.main' | 'error.main' => {
    if (value > 90) {
        return 'error.main' // Critical
    }
    if (value > 70) {
        return 'warning.main' // High
    }
    return 'success.main' // Normal
}


export function ContainerStatTable(
    {
        containers,
        onFieldClick,
        activeSortField,
        order,
        loading,
        placeHolders = 5,
    }: ContainersTableProps) {

    const isEmpty = !loading && containers.length === 0

    const handleSortRequest = (field: SORT_FIELD) => {
        if (loading || isEmpty) {
            return
        }
        const isAsc = activeSortField === field && order === ORDER.ASC
        const newOrder = isAsc ? ORDER.DSC : ORDER.ASC
        const finalOrder = activeSortField !== field ? ORDER.DSC : newOrder
        onFieldClick(field, finalOrder)
    }

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
    )

    const [copiedId, setCopiedId] = useState<string | null>(null)
    const handleCopy = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
        event.stopPropagation()
        navigator.clipboard.writeText(id).then()
        setCopiedId(id)
        setTimeout(() => {
            setCopiedId(null)
        }, 1500)
    }

    return (
        <Fade in={true} timeout={100}>
            <TableContainer component={Paper} variant="outlined">
                {/* By setting table-layout to fixed, the table's layout is determined by the widths of the columns in the header. */}
                <Table sx={{minWidth: 650, tableLayout: 'fixed'}} aria-label="container stats table">
                    <TableHead>
                        <TableRow sx={{'& th': {fontWeight: 'bold'}}}>
                            {/* For equally spaced columns, we assign a percentage width to each header cell. */}
                            <TableCell sx={{width: '15%'}}>
                                {createSortableHeader(SORT_FIELD.NAME, 'Container Name')}
                            </TableCell>
                            <TableCell sx={{width: '10%'}}>
                                {createSortableHeader(SORT_FIELD.CPU, 'CPU %')}
                            </TableCell>
                            <TableCell sx={{width: '10%'}}>
                                {createSortableHeader(SORT_FIELD.MEM, 'Memory Usage')}
                            </TableCell>
                            <TableCell sx={{width: '20%'}}>
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
                            <TableCell sx={{width: '20%'}}>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Typography variant="body2" sx={{fontWeight: 'bold', mr: 1}}>
                                        Block I/O:
                                    </Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        {createSortableHeader(SORT_FIELD.DISK_W, "Write", <EditIcon fontSize="small"/>)}
                                        <Typography component="span" sx={{mx: 0.5}}>/</Typography>
                                        {createSortableHeader(SORT_FIELD.DISK_R, "Read", <Article fontSize="small"/>)}
                                    </Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(placeHolders)].map((_, index) => (
                                <TableRow key={`skeleton-${index}`}>
                                    <TableCell><Skeleton animation="wave" variant="rounded"/></TableCell>
                                    <TableCell>
                                        <Skeleton animation="wave" variant="rounded"
                                                  width={80}
                                                  height={24}/>
                                    </TableCell>
                                    <TableCell><Skeleton animation="wave" variant="rounded"/></TableCell>
                                    <TableCell><Skeleton animation="wave" variant="rounded"/></TableCell>
                                    <TableCell><Skeleton animation="wave" variant="rounded"/></TableCell>
                                </TableRow>
                            ))
                        ) : isEmpty ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{py: 20}}>
                                    <Typography variant="h5" color="text.secondary">
                                        No stats found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            containers.map((container) => {
                                return (
                                    <Fade in={true} timeout={400}>
                                        <TableRow key={container.id}
                                                  sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                                            <TableCell component="th" scope="row">
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                                    <span>{container.name}</span>
                                                    <Tooltip
                                                        title={copiedId === container.id ? "Copied!" : "Copy container ID"}
                                                        placement="top">
                                                        <IconButton
                                                            onClick={(e) => handleCopy(e, container.id)}
                                                            size="small"
                                                            sx={{position: 'relative'}}
                                                        >
                                                            <CheckIcon
                                                                fontSize="inherit"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    opacity: copiedId === container.id ? 1 : 0,
                                                                    transition: 'opacity 0.2s',
                                                                    color: 'success.main'
                                                                }}
                                                            />
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
                                                <CPUStat
                                                    value={container.cpuUsage}
                                                    size={48}
                                                    thickness={1}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <UsageBar
                                                    usage={(Number(container.memoryUsage))}
                                                    limit={(Number(container.memoryLimit))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <RWData
                                                    download={Number(container.networkRx)}
                                                    upload={Number(container.networkTx)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <RWData
                                                    download={Number(container.blockWrite)}
                                                    upload={Number(container.blockRead)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </Fade>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Fade>
    )
}

const RWData = ({upload, download}: { upload: number; download: number }) => {
    const rx = Number(upload);
    const tx = Number(download);

    // Calculate the ratio, handling the case where tx is 0 to avoid division errors
    let ratioText = '0:1';
    if (tx > 0) {
        const ratio = (rx / tx).toFixed(1);
        ratioText = `${ratio}:1`;
    } else if (rx > 0) {
        // If there's download but no upload, the ratio is infinite
        ratioText = '∞';
    }

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start', gap: 1}}>
            <Typography
                variant="body2"
                sx={{color: 'primary.main', fontWeight: 'medium'}}
            >
                {ratioText}
            </Typography>

            {/* Download/Upload Column */}
            <Box sx={{display: 'flex', alignItems: 'center'}}>
                <Typography variant="body2" color="text.secondary">
                    {`${formatBytes(rx)} / ${formatBytes(tx)}`}
                </Typography>
            </Box>
        </Box>
    )
}

interface CPUStatProps {
    value: number,
    size: number,
    thickness: number,
}

function CPUStat(props: CPUStatProps) {
    const {value, size = 56, thickness = 4} = props
    const clampedValue = Math.min(value, 100)
    const theme = useTheme()
    const progressColor = getUsageColor(value)

    return (
        <Box sx={{position: 'relative', display: 'inline-flex'}}>
            <CircularProgress
                variant="determinate"
                sx={{
                    color: theme.palette.grey[800],
                }}
                size={size}
                thickness={thickness}
                value={100}
            />
            <CircularProgress
                variant="determinate"
                value={clampedValue}
                size={size}
                thickness={thickness}
                sx={{
                    color: progressColor,
                    position: 'absolute',
                    left: 0,
                }}
            />

            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="caption"
                    component="div"
                    sx={{fontWeight: 'bold', color: progressColor}}
                >
                    {`${value.toFixed(2)}`}
                </Typography>
            </Box>
        </Box>
    )
}

interface UsageBarProps {
    usage: number   // Formatted usage string, e.g., "2.92 GB"
    limit: number   // Formatted limit string, e.g., "15.5 GB"
    barHeight?: number  // Optional: makes the bar height configurable
}

export function UsageBar(
    {
        usage,
        limit,
        barHeight = 16
    }: UsageBarProps) {

    const theme = useTheme()
    const trackColor = theme.palette.grey[700]

    const memUsagePercent = limit > 0 ?
        (usage / limit) * 100 : 0

    const color = getUsageColor(memUsagePercent)
    const roundedValue = memUsagePercent.toFixed(0)

    const formattedUsage = formatBytes(usage)
    const formattedLimit = formatBytes(limit)

    return (
        <Tooltip title={`Memory Usage: ${memUsagePercent.toFixed(1)}%`} placement="top">
            <Box sx={{display: 'flex', flexDirection: 'column', minWidth: 150}}>
                <Box sx={{
                    position: 'relative',
                    width: '100%',
                    height: barHeight,
                    bgcolor: trackColor,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                }}>

                    <Box sx={{
                        width: `${memUsagePercent}%`,
                        height: '100%',
                        bgcolor: color,
                        borderRadius: 1,
                        transition: 'width 0.3s ease-in-out',
                    }}/>

                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute',
                            width: '100%',
                            textAlign: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)', // Keeps text readable
                        }}
                    >
                        {`${roundedValue}%`}
                    </Typography>
                </Box>

                <Box sx={{display: 'flex', justifyContent: 'flex-end', pt: 0.5}}>
                    <Typography variant="caption" color="text.secondary">
                        {`${formattedUsage} / ${formattedLimit}`}
                    </Typography>
                </Box>
            </Box>
        </Tooltip>
    )
}

const formatBytes = (bytes: number | bigint, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(k))
    return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
