import {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Paper,
    Snackbar,
    Typography
} from '@mui/material';
import {
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    RestartAlt as RestartAltIcon,
    Stop as StopIcon,
    Update as UpdateIcon,
} from '@mui/icons-material';
import {type ContainerList, DockerService, type Port} from "../gen/docker/v1/docker_pb.ts";
import {callRPC, useClient} from '../lib/api.ts';

interface DeployPageProps {
    selectedPage: string
}

interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

export function DeployPage({selectedPage}: DeployPageProps) {
    const [error, setError] = useState<string>("");
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'success'
    });

    const dockerService = useClient(DockerService);

    const [containers, setContainers] = useState<ContainerList[]>([]);

    useEffect(() => {
        if (!selectedPage) {
            setContainers([]);
            return;
        }

        const fetchContainers = async () => {
            const {val, err} = await callRPC(() => dockerService.list({filename: selectedPage}));
            if (err) {
                showSnackbar(`Failed to refresh containers: ${err}`, 'error');
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

    const showSnackbar = (message: string, severity: SnackbarState['severity'] = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({...prev, open: false}));
    };

    const handleCloseError = () => {
        setError("");
    };

    const deployActions = [
        {
            name: 'start',
            icon: <PlayArrowIcon/>,
            handler: async () => {
                handleActionStart('start');
                const {err} = await callRPC(() => dockerService.start({filename: selectedPage}));
                if (err) {
                    setError(`Failed to start deployment: ${err}`);
                } else {
                    showSnackbar('Deployment started successfully!', 'success');
                }
                handleActionEnd('start');
            }
        },
        {
            name: 'stop',
            icon: <StopIcon/>,
            handler: async () => {
                handleActionStart('stop');
                const {err} = await callRPC(() => dockerService.stop({filename: selectedPage}));
                if (err) {
                    setError(`Failed to stop deployment: ${err}`);
                } else {
                    showSnackbar('Deployment stopped successfully!', 'success');
                }
                handleActionEnd('stop');
            }
        },
        {
            name: 'remove',
            icon: <DeleteIcon/>,
            handler: async () => {
                handleActionStart('remove');
                const {err} = await callRPC(() => dockerService.remove({filename: selectedPage}));
                if (err) {
                    setError(`Failed to remove deployment: ${err}`);
                } else {
                    showSnackbar('Deployment removed successfully!', 'success');
                }
                handleActionEnd('remove');
            }
        },
        {
            name: 'restart',
            icon: <RestartAltIcon/>,
            handler: async () => {
                handleActionStart('restart');
                // todo
                // const {err} = await callRPC(() => dockerService.restart({filename: selectedPage}));
                // if (err) {
                //     setError(`Failed to restart deployment: ${err}`);
                // } else {
                //     showSnackbar('Deployment restarted successfully!', 'success');
                // }
                handleActionEnd('restart');
            }
        },
        {
            name: 'update',
            icon: <UpdateIcon/>,
            handler: async () => {
                handleActionStart('update');
                const {err} = await callRPC(() => dockerService.update({filename: selectedPage}));
                if (err) {
                    setError(`Failed to update deployment: ${err}`);
                } else {
                    showSnackbar('Deployment updated successfully!', 'success');
                }
                handleActionEnd('update');
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
        return ports.map(p => `${p.host}:${p.public}→${p.private}/${p.type}`).join(', ');
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
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                            <Grid container sx={{px: 2, color: 'text.secondary'}}>
                                {/* @ts-expect-error some dumb mui shit*/}
                                <Grid xs={12} sm={3}>
                                    <Typography variant="body2" fontWeight="bold">Name</Typography>
                                </Grid>
                                {/* @ts-expect-error some dumb mui shit*/}
                                <Grid xs={12} sm={2}>
                                    <Typography variant="body2" fontWeight="bold">Status</Typography>
                                </Grid>
                                {/* @ts-expect-error some dumb mui shit*/}
                                <Grid xs={12} sm={4}>
                                    <Typography variant="body2" fontWeight="bold">Image</Typography>
                                </Grid>
                                {/* @ts-expect-error some dumb mui shit*/}
                                <Grid xs={12} sm={3}>
                                    <Typography variant="body2" fontWeight="bold">Ports</Typography>
                                </Grid>
                            </Grid>
                            {containers.map((container) => (
                                <Paper key={container.id} elevation={2} sx={{p: 2}}>
                                    <Grid container alignItems="center" spacing={2}>
                                        {/* @ts-expect-error some dumb mui shit*/}
                                        <Grid item xs={12} sm={3}>
                                            <Typography variant="body1"
                                                        fontWeight="500">{container.name}</Typography>
                                        </Grid>
                                        {/* @ts-expect-error some dumb mui shit*/}
                                        <Grid item xs={12} sm={2}>
                                            <Chip label={container.status}
                                                  color={getStatusChipColor(container.status)}
                                                  size="small"/>
                                        </Grid>
                                        {/* @ts-expect-error some dumb mui shit*/}
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="body2" color="text.secondary"
                                                        sx={{wordBreak: 'break-all'}}>{container.imageName}</Typography>
                                        </Grid>
                                        {/* @ts-expect-error some dumb mui shit*/}
                                        <Grid item xs={12} sm={3}>
                                            <Typography variant="body2"
                                                        fontWeight="500">{formatPorts(container.ports)}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
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

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{width: '100%'}}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}