import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    RestartAlt as RestartAltIcon,
    Stop as StopIcon,
    Update as UpdateIcon,
} from '@mui/icons-material';
import {type ComposeActionResponse, type ContainerList, DockerService, type Port} from "../gen/docker/v1/docker_pb.ts";
import {callRPC, useClient} from '../lib/api.ts';
import {useSnackbar} from "../hooks/snackbar.ts";
import {trim} from "../lib/utils.ts";
import {ConnectError} from "@connectrpc/connect";
import TerminalPopup from "../components/terminal-logs.tsx";

interface DeployPageProps {
    selectedPage: string
}

export function StackDeploy({selectedPage}: DeployPageProps) {
    const dockerService = useClient(DockerService);
    const {showSuccess, showWarning} = useSnackbar();

    const [terminalMessages, setTerminalMessages] = useState<string[]>([]);
    const [isTerminalMinimized, setIsTerminalMinimized] = useState(true);
    const [terminalTitle, setTerminalTitle] = useState('');

    const [error, setError] = useState<string>("");
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [containers, setContainers] = useState<ContainerList[]>([]);

    useEffect(() => {
        if (!selectedPage) {
            setContainers([]);
            return;
        }

        const fetchContainers = async () => {
            const {val, err} = await callRPC(() => dockerService.list({filename: selectedPage}));
            if (err) {
                showWarning(`Failed to refresh containers: ${err}`);
                setContainers([]);
            } else {
                setContainers(val?.list || []);
            }
        };

        fetchContainers();
        const intervalId = setInterval(fetchContainers, 5000);
        return () => clearInterval(intervalId);
    }, [selectedPage, dockerService, showWarning]);

    const handleActionStart = (actionName: string) => {
        setLoadingStates(prev => ({...prev, [actionName]: true}));
    };

    const handleActionEnd = (actionName: string) => {
        setLoadingStates(prev => ({...prev, [actionName]: false}));
    };

    const handleCloseError = () => {
        setError("");
    };

    async function startActionStream(logStream: AsyncIterable<ComposeActionResponse>, actionName: string) {
        try {
            setTerminalMessages([]);
            setTerminalTitle(`${selectedPage}`);
            setIsTerminalMinimized(false);

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

    const deployHandler = (buttonName: string, actionName: string, handler: () => AsyncIterable<ComposeActionResponse>) => {
        handleActionStart(buttonName);
        const logStream = handler();
        startActionStream(logStream, actionName).finally(() => {
            handleActionEnd(buttonName);
        });
    }

    const deployActions = [
        {
            name: 'start',
            message: "started",
            icon: <PlayArrowIcon/>,
            action: dockerService.start,
        },
        {
            name: 'stop',
            message: "stopped",
            icon: <StopIcon/>,
            action: dockerService.stop,
        },
        {
            name: 'remove',
            message: "removed",
            icon: <DeleteIcon/>,
            action: dockerService.remove,
        },
        {
            name: 'restart',
            message: "restarted",
            icon: <RestartAltIcon/>,
            action: dockerService.restart,
        },
        {
            name: 'update',
            message: "updated",
            icon: <UpdateIcon/>,
            action: dockerService.update,
        },
    ];

    const getStatusChipColor = (status: string): "success" | "warning" | "default" | "error" => {
        if (status.toLowerCase().startsWith('up')) return 'success';
        if (status.toLowerCase().startsWith('exited')) return 'error';
        if (status.toLowerCase().includes('restarting')) return 'warning';
        return 'default';
    };

    const formatPorts = (ports: Port[]) => {
        if (!ports || ports.length === 0) {
            return <>—</>;
        }
        return (
            <>
                {ports.map((p, index) => (
                        <React.Fragment key={`${p.host}-${p.public}-${p.private}`}>
                            <Tooltip title={`Public Port`} arrow>
                                <Link
                                    href={`http://${p.host}:${p.public}`}
                                    target="_blank" // Opens the link in a new tab
                                    rel="noopener noreferrer" // Security
                                    sx={{textDecoration: 'none'}} // Removes the default underline
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            color: 'success.main',
                                            cursor: 'pointer', // Changed from 'help' to 'pointer' for a link
                                            '&:hover': {
                                                textDecoration: 'underline', // Add underline on hover for affordance
                                            },
                                        }}
                                    >
                                        {p.host}:{p.public}
                                    </Box>
                                </Link>
                            </Tooltip> {' → '}
                            <Tooltip title="Internal container port" arrow>
                                <Box component="span" sx={{color: 'info.main', cursor: 'pointer',}}>
                                    :{p.private}/{p.type}
                                </Box>
                            </Tooltip>
                            {index < ports.length - 1 && ', '}
                        </React.Fragment>
                    )
                )}
            </>
        );
    };

    return (
        <Box sx={{p: 3, height: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
                {deployActions.map((action) => (
                    <Button
                        key={action.name}
                        variant="outlined"
                        disabled={!selectedPage || loadingStates[action.name]}
                        onClick={() => {
                            deployHandler(
                                action.name,
                                action.message,
                                () => action.action({filename: selectedPage})
                            )
                        }}
                        startIcon={loadingStates[action.name] ?
                            <CircularProgress size={20} color="inherit"/> : action.icon}
                    >
                        {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                    </Button>
                ))}
            </Box>

            <Box
                sx={{
                    flexGrow: 1,
                    border: '2px dashed',
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgb(41,41,41)',
                    overflow: 'hidden'
                }}
            >
                {selectedPage && containers.length > 0 ? (
                    // 1. Give the TableContainer a specific maximum height.
                    //    This creates the "viewport" for scrolling.
                    <TableContainer
                        component={Paper}
                        sx={{
                            maxHeight: 440,
                            boxShadow: 3,
                            borderRadius: 2,
                        }}
                    >
                        {/* 2. Add the `stickyHeader` prop to the Table. */}
                        <Table stickyHeader aria-label="sticky header docker containers table">
                            <TableHead>
                                {/* 3. It's good practice to set a background on the header cells
                           so scrolling content doesn't show through. */}
                                <TableRow>
                                    <TableCell
                                        sx={{fontWeight: 'bold', backgroundColor: 'background.paper'}}>Name</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        backgroundColor: 'background.paper'
                                    }}>Status</TableCell>
                                    <TableCell
                                        sx={{fontWeight: 'bold', backgroundColor: 'background.paper'}}>Image</TableCell>
                                    <TableCell
                                        sx={{fontWeight: 'bold', backgroundColor: 'background.paper'}}>Ports</TableCell>
                                    <TableCell sx={{
                                        fontWeight: 'bold',
                                        backgroundColor: 'background.paper'
                                    }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>

                            {/* This TableBody will now be the scrollable part within the container */}
                            <TableBody>
                                {containers.map((container) => (
                                    <TableRow
                                        hover // Adds a nice hover effect
                                        key={container.id}
                                        sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body1"
                                                        fontWeight="500">{trim(container.name, "/")}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={container.status}
                                                color={getStatusChipColor(container.status)}
                                                size="small"
                                                sx={{textTransform: 'capitalize'}}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary"
                                                        sx={{wordBreak: 'break-all'}}>
                                                {container.imageName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{formatPorts(container.ports)}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1}>
                                                <PlayArrowIcon
                                                    aria-label="start container"
                                                    color="success"
                                                    onClick={() => {
                                                    }}
                                                    sx={{cursor: 'pointer'}}
                                                />
                                                <StopIcon
                                                    aria-label="stop container"
                                                    color="error"
                                                    onClick={() => {
                                                    }}
                                                    sx={{cursor: 'pointer'}}
                                                />
                                                <RestartAltIcon
                                                    aria-label="restart container"
                                                    color="primary"
                                                    onClick={() => {
                                                    }}
                                                    sx={{cursor: 'pointer'}}
                                                />
                                                <DeleteIcon
                                                    aria-label="delete container"
                                                    color="warning"
                                                    onClick={() => {
                                                    }}
                                                    sx={{cursor: 'pointer'}}
                                                />
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    // ... your other conditional rendering ...
                    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                        <Typography variant="h5" color="text.secondary">
                            {selectedPage ? 'No containers found...' : 'Select a page'}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box
                sx={{
                    p: 2,
                    borderTop: '1px solid rgba(255, 255, 255, 0.23)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    flexShrink: 0 // Prevents the bar from shrinking
                }}
            >
                <Button
                    variant="outlined"
                    onClick={() => setIsTerminalMinimized(!isTerminalMinimized)}
                >
                    Logs
                </Button>
            </Box>

            {/* Terminal Popup Component */}
            <TerminalPopup
                isOpen={true}
                isMinimized={isTerminalMinimized}
                messages={terminalMessages}
                title={terminalTitle}
                onMinimizeToggle={() => setIsTerminalMinimized(prev => !prev)}
            />

            {/* Error Dialog */}
            <Dialog open={error !== ""} onClose={handleCloseError}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    <Typography>{error}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseError} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
        ;
}