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
    Tooltip,
    Typography
} from '@mui/material'
import {DocumentScannerOutlined} from '@mui/icons-material'
import {ContainerPort} from './container-port.tsx'
import type {ContainerList, Port} from "../../../gen/docker/v1/docker_pb.ts";

interface ContainerTableProps {
    containers: ContainerList[]
    onShowLogs: (containerId: string, containerName: string) => void
    loading: boolean
    selectedServices: string[]
    setSelectedServices: (services: string[]) => void
}

export function ContainerTable(
    {
        containers,
        onShowLogs,
        loading,
        setSelectedServices,
        selectedServices
    }: ContainerTableProps) {
    const [isLoaded, setIsLoaded] = useState(false)

    // This effect sets `isLoaded` to true only once after the first data fetch.
    useEffect(() => {
        if (!loading && !isLoaded) {
            setTimeout(() => setIsLoaded(true), 50)
        }
    }, [loading, isLoaded])

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allSelects = containers.map((n) => n.serviceName)
            setSelectedServices(allSelects)
            return
        }
        setSelectedServices([])
    }

    const handleRowClick = (id: string) => {
        console.log("row", id)
        const selectedIndex = selectedServices.indexOf(id);
        let newSelected: string[];

        if (selectedIndex === -1) {
            // select id
            newSelected = [...selectedServices, id];
        } else {
            // deselect id
            newSelected = selectedServices.filter((serviceId) => serviceId !== id);
        }

        setSelectedServices(newSelected);
    }

    const isEmpty = !loading && containers.length === 0

    return (
        <TableContainer component={Paper} sx={{flexGrow: 1, boxShadow: 3, borderRadius: 2}}>
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
                        <TableCell sx={tableHeaderStyles}>Name</TableCell>
                        <TableCell sx={tableHeaderStyles}>Status</TableCell>
                        <TableCell sx={tableHeaderStyles}>Image</TableCell>
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
                            {/* Updated colSpan to account for the new checkbox column */}
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
                                        No containers found for this deployment
                                    </Typography>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ) : containers.map((container) => {
                        const isItemSelected = selectedServices.includes(container.serviceName)
                        const labelId = `container-table-checkbox-${container.id}`

                        return (
                            <TableRow
                                hover
                                onClick={() => handleRowClick(container.serviceName)}
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
                    <ContainerPort port={port}/>
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


/**
 * Generates a clickable URL for a container image, pointing to its repository.
 * Handles Docker Hub and other public/private registries.
 * @param {
 string
 } imageName The full name of the docker image (e.g., "nginx:latest", "gcr.io/my-project/my-image:v1").
 * @returns {
 string
 } The full URL to the image's web home page.
 */
const getImageHomePageUrl = (imageName: string): string => {
    if (!imageName) {
        return '#' // Return a non-functional link if name is missing
    }

    // Strip the tag or digest from the image name
    // e.g., "nginx:latest" -> "nginx", "gcr.io/img@sha256:..." -> "gcr.io/img"
    let cleanName = imageName.split('@')[0]
    const tagIndex = cleanName.lastIndexOf(':')
    if (tagIndex > 0 && !cleanName.substring(tagIndex + 1).includes('/')) {
        cleanName = cleanName.substring(0, tagIndex)
    }

    const nameSplit = cleanName.split('/')
    const firstPart = nameSplit[0]
    const isCustomRegistry = firstPart.includes('.') || firstPart.includes(':')

    const customRegistryMap: Record<string, (image: string[]) => string> = {
        "lscr.io": (splits: string[]) => {
            // expected ["lscr.io", "linuxserver", "radarr"] <- get last part
            return `https://docs.linuxserver.io/images/docker-${splits[2]}`
        },
    }

    if (isCustomRegistry) {
        const registryDomain = nameSplit[0]
        const customUrl = customRegistryMap[registryDomain]
        if (customUrl) {
            // For known custom registries with special URL patterns
            return customUrl(nameSplit)
        }
        // For other registries, link to the registry itself
        return `https://${cleanName}`
    } else {
        // It's a Docker Hub image
        if (nameSplit.length === 1) {
            // Official Docker Hub image (e.g., "nginx")
            return `https://hub.docker.com/_/${cleanName}`
        } else {
            // User/organization image (e.g., "user/image")
            return `https://hub.docker.com/r/${cleanName}`
        }
    }
}