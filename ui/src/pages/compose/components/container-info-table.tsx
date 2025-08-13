import React, {useEffect, useState} from 'react'
import {
    Box,
    Checkbox,
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
    TableSortLabel,
    Tooltip,
    Typography
} from '@mui/material'
import {DocumentScannerOutlined} from '@mui/icons-material'
import {ContainerInfoPort} from './container-info-port.tsx'
import type {ContainerList, Port} from "../../../gen/docker/v1/docker_pb.ts"
import {getImageHomePageUrl} from "../../../hooks/docker-images.ts"
import scrollbarStyles from "../../../components/scrollbar-style.tsx"
import type {Message} from "@bufbuild/protobuf"
import {useNavigate} from "react-router-dom"

interface ContainerTableProps {
    containers: ContainerList[]
    loading: boolean
    selectedServices: string[]
    onShowLogs: (containerId: string, containerName: string) => void
    setSelectedServices: (services: string[]) => void,
    useContainerId?: boolean,
}

type SortField = 'name' | 'status' | 'image' | 'stack'
type SortOrder = 'asc' | 'desc'

export function ContainerTable(
    {
        containers,
        onShowLogs,
        loading,
        setSelectedServices,
        selectedServices,
        useContainerId = false,
    }: ContainerTableProps
) {
    const navigate = useNavigate()
    const [isLoaded, setIsLoaded] = useState(false)

    const [sortField, setSortField] = useState<SortField>('status')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    const sortedContainers = [...containers].sort((a, b) => {
        let aValue: unknown, bValue: unknown
        let comparison = 0;

        switch (sortField) {
            case 'name': {
                aValue = a.serviceName
                bValue = b.serviceName
                comparison = (aValue as string).localeCompare(bValue as string)
                break
            }
            case "status": {
                aValue = a.status
                bValue = b.status
                comparison = (aValue as string).localeCompare(bValue as string)
                break
            }
            case "image": {
                aValue = a.imageName
                bValue = b.imageName
                comparison = (aValue as string).localeCompare(bValue as string)
                break
            }
            case "stack": {
                aValue = a.stackName
                bValue = b.stackName
                comparison = (aValue as string).localeCompare(bValue as string)
                break
            }
            default:
                return 0
        }

        return sortOrder === 'asc' ? comparison : -comparison
    })

    // This effect sets `isLoaded` to true only once after the first data fetch.
    useEffect(() => {
        if (!loading && !isLoaded) {
            setTimeout(() => setIsLoaded(true), 50)
        }
    }, [loading, isLoaded])

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allSelects = containers.map((n) => getContName(n))
            setSelectedServices(allSelects)
            return
        }
        setSelectedServices([])
    }

    const handleRowClick = (id: string) => {
        const selectedIndex = selectedServices.indexOf(id)
        let newSelected: string[]

        if (selectedIndex === -1) {
            // select id
            newSelected = [...selectedServices, id]
        } else {
            // deselect id
            newSelected = selectedServices.filter((serviceId) => serviceId !== id)
        }

        setSelectedServices(newSelected)
    }

    const isEmpty = !loading && containers.length === 0

    const getContName = (container: Message<"docker.v1.ContainerList"> & {
        id: string
        imageID: string
        imageName: string
        status: string
        name: string
        created: string
        ports: Port[]
        serviceName: string
    }) => useContainerId ? container.id : container.serviceName

    return (
        <TableContainer
            component={Paper}
            sx={{
                flexGrow: 1,
                boxShadow: 3,
                borderRadius: 2,
                ...scrollbarStyles
            }}>
            <Table stickyHeader aria-label="docker containers table">
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                color="primary"
                                indeterminate={selectedServices.length > 0 && selectedServices.length < containers.length}
                                checked={containers.length > 0 && selectedServices.length === containers.length}
                                onChange={handleSelectAllClick}
                                slotProps={{
                                    input: {'aria-label': 'select all containers'}
                                }}
                            />
                        </TableCell>
                        <TableCell sx={tableHeaderStyles}>
                            <TableSortLabel
                                active={sortField === 'name'}
                                direction={sortField === 'name' ? sortOrder : 'asc'}
                                onClick={() => handleSort('name')}
                            >
                                Containers
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableHeaderStyles}>
                            <TableSortLabel
                                active={sortField === 'status'}
                                direction={sortField === 'status' ? sortOrder : 'asc'}
                                onClick={() => handleSort('status')}
                            >
                                Status
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableHeaderStyles}>
                            <TableSortLabel
                                active={sortField === 'image'}
                                direction={sortField === 'image' ? sortOrder : 'asc'}
                                onClick={() => handleSort('image')}
                            >
                                Image
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableHeaderStyles}>
                            <TableSortLabel
                                active={sortField === 'stack'}
                                direction={sortField === 'stack' ? sortOrder : 'asc'}
                                onClick={() => handleSort('stack')}
                            >
                                Stack
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableHeaderStyles}>Ports</TableCell>
                        <TableCell sx={tableHeaderStyles}>Actions</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody
                    sx={{
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 200ms ease-in-out',
                    }}
                >
                    {isEmpty ? (
                        <TableRow>
                            <TableCell colSpan={6} sx={{border: 0, height: 200}}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                    }}
                                >
                                    <Typography variant="h5" color="text.secondary">
                                        No containers found
                                    </Typography>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ) : sortedContainers.map((container) => {
                        const isItemSelected = selectedServices.includes(getContName(container))
                        const labelId = `container-table-checkbox-${container.id}`

                        return (
                            <TableRow
                                hover
                                onClick={() => handleRowClick(getContName(container))}
                                role="checkbox"
                                aria-checked={isItemSelected}
                                tabIndex={-1}
                                key={container.id}
                                selected={isItemSelected}
                                sx={{cursor: 'pointer', '&:last-child td, &:last-child th': {border: 0}}}
                            >
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        checked={isItemSelected}
                                        slotProps={{
                                            input: {'aria-labelledby': labelId}
                                        }}
                                    />
                                </TableCell>
                                <TableCell component="th" id={labelId} scope="row">
                                    <Typography variant="body1" fontWeight="500">{container.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={container.status} color={getStatusChipColor(container.status)}
                                          size="small" sx={{textTransform: 'capitalize'}}/>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="Open image website" arrow>
                                        <Link
                                            href={getImageHomePageUrl(container.imageName)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{textDecoration: 'none', color: 'primary.main'}}
                                            onClick={(event) => event.stopPropagation()} // Prevent row click
                                        >
                                            <Typography variant="body2" component="span" sx={{
                                                wordBreak: 'break-all',
                                                '&:hover': {textDecoration: 'underline'}
                                            }}>
                                                {container.imageName}
                                            </Typography>
                                        </Link>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        variant="body2"
                                        component="span"
                                        sx={{
                                            textDecoration: 'none',
                                            color: 'primary.main',
                                            wordBreak: 'break-all',
                                            cursor: 'pointer',
                                            '&:hover': {textDecoration: 'underline'}
                                        }}
                                        onClick={(event) => {
                                            event.stopPropagation() // Prevent row click
                                            navigate(`/stacks/${container.servicePath}?tab=0`)
                                        }}
                                    >
                                        {container.stackName}
                                    </Typography>
                                </TableCell>
                                <TableCell width={360}>
                                    {formatPorts(container.ports)}
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-start">
                                        <Tooltip title="Show container logs">
                                            <DocumentScannerOutlined
                                                aria-label="Show container logs"
                                                color="primary"
                                                onClick={(event) => {
                                                    event.stopPropagation() // Prevent row click
                                                    onShowLogs(container.id, container.name)
                                                }}
                                                sx={{cursor: 'pointer'}}
                                            />
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

const tableHeaderStyles = {
    fontWeight: 'bold',
    backgroundColor: 'background.paper'
}

const formatPorts = (ports: Port[]) => {
    if (!ports || ports.length === 0) return <>—</>
    return (
        <>
            {ports.map((port, index) => (
                <React.Fragment key={`${port.host}-${port.public}-${port.private}-${port.type}`}>
                    <ContainerInfoPort port={port}/>
                    {index < ports.length - 1 && ', '}
                </React.Fragment>
            ))}
        </>
    )
}

const getStatusChipColor = (status: string): "success" | "warning" | "default" | "error" => {
    if (status.toLowerCase().startsWith('up')) return 'success'
    if (status.toLowerCase().startsWith('exited')) return 'error'
    if (status.toLowerCase().includes('restarting')) return 'warning'
    return 'default'
}


