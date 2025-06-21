// PortMapping.tsx
import React, {useEffect, useRef, useState} from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
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
import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    RestartAlt as RestartAltIcon,
    Stop as StopIcon,
    Terminal as TerminalIcon,
    Update as UpdateIcon,
} from '@mui/icons-material';
import {type ComposeActionResponse, type ContainerList, DockerService, type Port} from "../gen/docker/v1/docker_pb.ts";
import {callRPC, useClient} from '../lib/api.ts';
import {useSnackbar} from "../hooks/snackbar.ts";
import {getImageHomePageUrl, getStatusChipColor, trim} from "../lib/utils.ts";
import {ConnectError} from "@connectrpc/connect";

interface DeployPageProps {
    selectedPage: string
}

export function StackDeploy({selectedPage}: DeployPageProps) {
    const dockerService = useClient(DockerService);
    const {showSuccess} = useSnackbar();

    const [terminalMessages, setTerminalMessages] = useState<string[]>([]);
    const [isLogsPanelMinimized, setIsLogsPanelMinimized] = useState(true);
    const [terminalTitle, setTerminalTitle] = useState('');
    const terminalEndRef = useRef<HTMLDivElement>(null);

    const [error, setError] = useState<string>("");
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [containers, setContainers] = useState<ContainerList[]>([]);

    // Effect to auto-scroll terminal to the bottom
    useEffect(() => {
        if (!isLogsPanelMinimized) {
            terminalEndRef.current?.scrollIntoView({behavior: 'smooth'});
        }
    }, [terminalMessages, isLogsPanelMinimized]);


    useEffect(() => {
        if (!selectedPage) {
            setContainers([]);
            return;
        }

        const fetchContainers = async () => {
            const {val, err} = await callRPC(() => dockerService.list({filename: selectedPage}));
            if (err) {
                // Don't show a snackbar on every poll failure
                console.warn(`Failed to refresh containers: ${err}`);
                setContainers([]);
            } else {
                setContainers(val?.list || []);
            }
        };

        fetchContainers();
        const intervalId = setInterval(fetchContainers, 5000);
        return () => clearInterval(intervalId);
    }, [selectedPage, dockerService]);

    const handleActionStart = (actionName: string) => {
        setLoadingStates(prev => ({...prev, [actionName]: true}));
    };

    const handleActionEnd = (actionName: string) => {
        setLoadingStates(prev => ({...prev, [actionName]: false}));
    };

    const handleCloseError = () => {
        setError("");
    };

    async function startActionStream(logStream: AsyncIterable<ComposeActionResponse>, buttonName: string, actionName: string) {
        try {
            setTerminalMessages([]);
            setTerminalTitle(`${buttonName} - ${selectedPage}`);
            setIsLogsPanelMinimized(false);

            for await (const mes of logStream) {
                setTerminalMessages(prevMessages => [...prevMessages, mes.message]);
            }

            showSuccess(`Deployment ${actionName} successfully!`)
        } catch (error: unknown) {
            if (error instanceof ConnectError) {
                setError(`Failed to ${actionName} deployment\n${error.code} ${error.name}: ${error.message}`);
            } else {
                setError(`Failed to ${actionName} deployment\nUnknown Error: ${(error as Error).toString()}`);
            }
        }
    }

    const deployHandler = (buttonName: string, messageName: string, handler: () => AsyncIterable<ComposeActionResponse>) => {
        handleActionStart(buttonName);
        const logStream = handler();
        startActionStream(logStream, buttonName, messageName).finally(() => {
            handleActionEnd(buttonName);
        });
    }

    const deployActions = [
        {name: 'start', message: "started", icon: <PlayArrowIcon/>, action: dockerService.start},
        {name: 'stop', message: "stopped", icon: <StopIcon/>, action: dockerService.stop},
        {name: 'remove', message: "removed", icon: <DeleteIcon/>, action: dockerService.remove},
        {name: 'restart', message: "restarted", icon: <RestartAltIcon/>, action: dockerService.restart},
        {name: 'update', message: "updated", icon: <UpdateIcon/>, action: dockerService.update},
    ];

    if (!selectedPage) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                <Typography variant="h5" color="text.secondary">Select a page</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default'}}>
            {/* Main Content Area */}
            <Box sx={{flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                {/* Action Buttons */}
                <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, flexShrink: 0}}>
                    {deployActions.map((action) => (
                        <Button
                            key={action.name}
                            variant="outlined"
                            disabled={!selectedPage || loadingStates[action.name]}
                            onClick={() => {
                                deployHandler(action.name, action.message, () => action.action({filename: selectedPage}))
                            }}
                            startIcon={loadingStates[action.name] ?
                                <CircularProgress size={20} color="inherit"/> : action.icon}
                        >
                            {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                        </Button>
                    ))}
                </Box>

                {/* Container Table Area */}
                <Fade in={true}>
                    <Box sx={{
                        height: '78vh',
                        overflow: 'hidden',
                        border: '2px dashed',
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'rgb(41,41,41)'
                    }}>
                        {!(containers.length > 0) ?
                            (<Box
                                sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                                <Typography variant="h5" color="text.secondary">No containers found for this
                                    deployment</Typography>
                            </Box>) :
                            (<TableContainer component={Paper} sx={{flexGrow: 1, boxShadow: 3, borderRadius: 2}}>
                                <Table stickyHeader aria-label="sticky header docker containers table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: 'background.paper'
                                            }}>Name</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: 'background.paper'
                                            }}>Status</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: 'background.paper'
                                            }}>Image</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: 'background.paper'
                                            }}>Ports</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: 'background.paper'
                                            }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {containers.map((container) => (
                                            <TableRow hover key={container.id}
                                                      sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                                                <TableCell component="th" scope="row">
                                                    <Typography variant="body1"
                                                                fontWeight="500">{trim(container.name, "/")}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={container.status}
                                                          color={getStatusChipColor(container.status)} size="small"
                                                          sx={{textTransform: 'capitalize'}}/>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={getImageHomePageUrl(container.imageName)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{textDecoration: 'none', color: 'primary.main'}}
                                                    >
                                                        <Tooltip title="Open image page">
                                                            <Typography
                                                                variant="body2"
                                                                // color="text.info"
                                                                sx={{
                                                                    wordBreak: 'break-all',
                                                                    // Add hover effect to indicate it's clickable
                                                                    '&:hover': {
                                                                        textDecoration: 'underline',
                                                                        color: 'primary.main'
                                                                    }
                                                                }}
                                                            >
                                                                {container.imageName}
                                                            </Typography>
                                                        </Tooltip>
                                                    </Link>
                                                </TableCell>
                                                <TableCell width={360}>
                                                    {formatPorts(container.ports)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1}>
                                                        <PlayArrowIcon aria-label="start container" color="success"
                                                                       sx={{cursor: 'pointer'}}/>
                                                        <StopIcon aria-label="stop container" color="error"
                                                                  sx={{cursor: 'pointer'}}/>
                                                        <RestartAltIcon aria-label="restart container" color="primary"
                                                                        sx={{cursor: 'pointer'}}/>
                                                        <DeleteIcon aria-label="delete container" color="warning"
                                                                    sx={{cursor: 'pointer'}}/>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>)}
                    </Box>
                </Fade>
            </Box>

            {/* Logs Panel */}
            <Paper
                elevation={8}
                square
                sx={{
                    height: !isLogsPanelMinimized ? '40vh' : 0,
                    transition: 'height 0.12s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#1E1E1E',
                    color: '#CCCCCC',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: '4px 12px',
                    backgroundColor: '#333333',
                    flexShrink: 0,
                }}>
                    <Typography variant="body2" sx={{textTransform: 'uppercase', fontWeight: 'bold'}}>
                        {terminalTitle || 'LOGS'}
                    </Typography>
                    <IconButton size="large" onClick={() => setIsLogsPanelMinimized(true)} title="Close Panel">
                        <CloseIcon fontSize="small" sx={{color: 'white'}}/>
                    </IconButton>
                </Box>
                <Box sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    '& > div': {whiteSpace: 'pre-wrap', wordBreak: 'break-all'}
                }}>
                    {terminalMessages.map((msg, index) => (<div key={index}>{msg}</div>))}
                    <div ref={terminalEndRef}/>
                </Box>
            </Paper>

            {/* IDE like Status Bar */}
            <Box sx={{
                backgroundColor: '#007ACC',
                color: 'white',
                height: '5vh',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                zIndex: 1201
            }}>
                <Button
                    color="inherit"
                    size="large"
                    startIcon={<TerminalIcon/>}
                    onClick={() => setIsLogsPanelMinimized(prev => !prev)}
                    sx={{
                        textTransform: 'none',
                        p: '0 8px',
                        ml: 1,
                        height: '100%',
                        borderRadius: 0,
                        '&:hover': {backgroundColor: 'rgba(255,255,255,0.1)'}
                    }}
                >
                    Logs
                </Button>
            </Box>

            {/* Error Dialog */}
            <Dialog open={error !== ""} onClose={handleCloseError}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Typography sx={{whiteSpace: 'pre-wrap'}}>{error}</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseError} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}


const formatPorts = (ports: Port[]) => {
    if (!ports || ports.length === 0) {
        return <>—</>;
    }

    ports.sort((a, b) => {
        // Primary Sort: by public port
        const publicA = a.public || 0;
        const publicB = b.public || 0;
        if (publicA !== publicB) {
            return publicA - publicB;
        }

        // Secondary Sort: by type ('tcp' before 'udp')
        const typeCompare = a.type.localeCompare(b.type);
        if (typeCompare !== 0) {
            return typeCompare;
        }
        // Tertiary Sort (for stability): by private port
        return (a.private || 0) - (b.private || 0);
    });

    return (
        <>
            {ports.map((port, index) => (
                <React.Fragment key={`${port.host}-${port.public}-${port.private}-${port.type}`}>
                    <PortMapping port={port}/>
                    {index < ports.length - 1 && ', '}
                </React.Fragment>
            ))}
        </>
    );
};

interface PortMappingProps {
    port: Port;
}

const PortMapping = ({port}: PortMappingProps) => {
    const {host, public: publicPort, private: privatePort, type} = port;

    return (
        <>
            {publicPort && (
                <>
                    <Tooltip title="Public Port: open in new tab" arrow>
                        <Link
                            href={`http://${host || 'localhost'}:${publicPort}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: 'info.main',
                                textDecoration: 'none',
                                '&:hover': {textDecoration: 'underline'},
                            }}
                        >
                            {host || 'localhost'}:{publicPort}
                        </Link>
                    </Tooltip>
                    {' → '}
                </>
            )}

            <Tooltip title="Internal container port" arrow>
                <Box component="span" sx={{color: 'success.main', cursor: 'help'}}>
                    {privatePort}/{type}
                </Box>
            </Tooltip>
        </>
    );
};