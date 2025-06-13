import {useState} from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    Typography
} from '@mui/material';
import {
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    RestartAlt as RestartAltIcon,
    Stop as StopIcon,
    Update as UpdateIcon
} from '@mui/icons-material';
import {callRPC, useClient} from "../lib/api.ts";
import {DockerService} from "../gen/docker/v1/docker_pb.ts";

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
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)'
                }}
            >
                {selectedPage ?
                    <Typography variant="h5" color="text.secondary">
                        Deployment Status and Logs Placeholder
                    </Typography> :
                    <Typography variant="h5" color="text.secondary">
                        Select a page
                    </Typography>}
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
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
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