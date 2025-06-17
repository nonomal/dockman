import {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
import {useSnackbar} from "../components/snackbar.tsx";
import {trim} from "../lib/utils.ts";
import {ConnectError} from "@connectrpc/connect";
import TerminalPopup from "../components/terminal-logs.tsx";

interface DeployPageProps {
    selectedPage: string
}

export function DeployPage({selectedPage}: DeployPageProps) {
    const dockerService = useClient(DockerService);
    const {showSuccess, showWarning} = useSnackbar();

    const [terminalMessages, setTerminalMessages] = useState<string[]>([]);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
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

    async function startActionStream(logStream: AsyncIterable<ComposeActionResponse>) {
        try {
            setTerminalMessages([]);
            setTerminalTitle(`${selectedPage}`);
            setIsTerminalMinimized(false);
            setIsTerminalOpen(true);

            for await (const mes of logStream) {
                setTerminalMessages(prevMessages => [...prevMessages, mes.message]);
            }

            showSuccess('Deployment started successfully!')
        } catch (error: unknown) {
            if (error instanceof ConnectError) {
                setError(`Failed to start deployment\n${error.code} ${error.name}: ${error.message}`);
            } else {
                setError(`Failed to start deployment\nUnknown Error: ${(error as Error).toString()}`);
            }
        }
    }

    const deployActions = [
        {
            name: 'start',
            icon: <PlayArrowIcon/>,
            handler: async () => {
                handleActionStart('start');
                const logStream = dockerService.start({filename: selectedPage});
                startActionStream(logStream).finally(() => {
                    handleActionEnd('start');
                });
            }
        },
        {
            name: 'stop',
            icon: <StopIcon/>,
            handler: async () => {
                handleActionStart('stop');
                const logStream = dockerService.stop({filename: selectedPage});
                startActionStream(logStream).finally(() => {
                    handleActionEnd('stop');
                });
            }
        },
        {
            name: 'remove',
            icon: <DeleteIcon/>,
            handler: async () => {
                handleActionStart('remove');

                const logStream = dockerService.remove({filename: selectedPage});
                startActionStream(logStream).finally(() => {
                    handleActionEnd('remove');
                });
            }
        },
        {
            name: 'restart',
            icon: <RestartAltIcon/>,
            handler: async () => {
                handleActionStart('restart');

                const logStream = dockerService.restart({filename: selectedPage});
                startActionStream(logStream).finally(() => {
                    handleActionEnd('restart');
                });
            }
        },
        {
            name: 'update',
            icon: <UpdateIcon/>,
            handler: async () => {
                handleActionStart('update');

                const logStream = dockerService.update({filename: selectedPage});
                startActionStream(logStream).finally(() => {
                    handleActionEnd('update');
                });
            }
        },
    ];

    const getStatusChipColor = (status: string): "success" | "warning" | "default" | "error" => {
        if (status.toLowerCase().startsWith('up')) return 'success';
        if (status.toLowerCase().startsWith('exited')) return 'error';
        if (status.toLowerCase().includes('restarting')) return 'warning';
        return 'default';
    };

    const formatPorts = (ports: Port[]): string => {
        if (!ports || ports.length === 0) {
            return '—';
        }
        return ports.map(p => `${p.host}:${p.public} → :${p.private}/${p.type}`).join(', ');
    };

    return (
        <Box sx={{p: 3, height: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
                {deployActions.map((action) => (
                    <Button
                        key={action.name}
                        variant="outlined"
                        disabled={!selectedPage || loadingStates[action.name]}
                        onClick={action.handler}
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
                    borderRadius: 1,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(0,0,0,0.1)'
                }}
            >
                {selectedPage ? (
                    containers.length > 0 ? (
                        <TableContainer component={Paper} sx={{boxShadow: 3, borderRadius: 2}}>
                            <Table sx={{minWidth: 650}} aria-label="docker containers table">
                                {/* Table Header */}
                                <TableHead>
                                    <TableRow sx={{'& th': {border: 0}}}>
                                        <TableCell sx={{fontWeight: 'bold', color: 'text.secondary'}}>Name</TableCell>
                                        <TableCell sx={{fontWeight: 'bold', color: 'text.secondary'}}>Status</TableCell>
                                        <TableCell sx={{fontWeight: 'bold', color: 'text.secondary'}}>Image</TableCell>
                                        <TableCell sx={{fontWeight: 'bold', color: 'text.secondary'}}>Ports</TableCell>
                                    </TableRow>
                                </TableHead>

                                {/* Table Body */}
                                <TableBody>
                                    {containers.map((container) => (
                                        <TableRow
                                            key={container.id}
                                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                        >
                                            {/* Name Cell */}
                                            <TableCell component="th" scope="row">
                                                <Typography variant="body1"
                                                            fontWeight="500">{trim(container.name, "/")}</Typography>
                                            </TableCell>

                                            {/* Status Cell */}
                                            <TableCell>
                                                <Chip
                                                    label={container.status}
                                                    color={getStatusChipColor(container.status)}
                                                    size="small"
                                                    sx={{textTransform: 'capitalize'}}
                                                />
                                            </TableCell>

                                            {/* Image Cell */}
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{wordBreak: 'break-all'}}>
                                                    {container.imageName}
                                                </Typography>
                                            </TableCell>

                                            {/* Ports Cell */}
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="500">
                                                    {formatPorts(container.ports)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <Typography variant="h6" color="text.secondary">
                                No containers found for this deployment.
                            </Typography>
                        </Box>
                    )
                ) : (
                    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                        <Typography variant="h5" color="text.secondary">
                            Select a page
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* --- Bottom Bar --- */}
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
                isOpen={isTerminalOpen}
                isMinimized={isTerminalMinimized}
                messages={terminalMessages}
                title={terminalTitle}
                onClose={() => setIsTerminalOpen(false)}
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