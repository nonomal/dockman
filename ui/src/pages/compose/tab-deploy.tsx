import {useEffect, useRef, useState} from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography
} from '@mui/material';
import {
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    RestartAlt as RestartAltIcon,
    Stop as StopIcon,
    Update as UpdateIcon
} from '@mui/icons-material';
import {ContainerTable} from './components/container-info-table';
import {LogsPanel} from './components/logs-panel';
import {transformAsyncIterable, useClient} from "../../lib/api.ts";
import {DockerService} from '../../gen/docker/v1/docker_pb.ts';
import {useDockerCompose} from '../../hooks/docker-compose.ts';
import {useSnackbar} from "../../hooks/snackbar.ts";

const deployActionsConfig = [
    {name: 'start', rpcName: 'composeStart', message: "started", icon: <PlayArrowIcon/>},
    {name: 'stop', rpcName: 'composeStop', message: "stopped", icon: <StopIcon/>},
    {name: 'remove', rpcName: 'composeRemove', message: "removed", icon: <DeleteIcon/>},
    {name: 'restart', rpcName: 'composeRestart', message: "restarted", icon: <RestartAltIcon/>},
    {name: 'update', rpcName: 'composeUpdate', message: "updated", icon: <UpdateIcon/>},
] as const;

interface DeployPageProps {
    selectedPage: string;
}

export function TabDeploy({selectedPage}: DeployPageProps) {
    const dockerService = useClient(DockerService);
    const {containers, fetchContainers, loading} = useDockerCompose(selectedPage);
    const {showSuccess} = useSnackbar()

    const [panelTitle, setPanelTitle] = useState("Logs")
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [logStream, setLogStream] = useState<AsyncIterable<string> | null>(null);
    const [isLogPanelMinimized, setIsLogPanelMinimized] = useState(true);
    const [selectedServices, setSelectedServices] = useState<string[]>([])

    const abortControllerRef = useRef<AbortController | null>(null);

    const [composeErrorDialog, setComposeErrorDialog] = useState<{ dialog: boolean; message: string }>({
        dialog: false,
        message: ''
    })
    const closeErrorDialog = () => {
        setComposeErrorDialog(prev => ({...prev, dialog: false}))
    }
    const showErrorDialog = (message: string) => {
        setComposeErrorDialog(() => ({dialog: true, message}))
    }

    useEffect(() => {
        return () => {
            // If there's an active controller when the component unmounts, abort it.
            abortControllerRef.current?.abort("Component unmounted");
        };
    }, []);

    const handleComposeAction = (
        name: typeof deployActionsConfig[number]['name'],
        message: string,
        rpcName: typeof deployActionsConfig[number]['rpcName'],
    ) => {
        setActiveAction(name)

        manageStream({
            getStream: signal => dockerService[rpcName]({
                filename: selectedPage,
                selectedServices: selectedServices,
            }, {signal: signal}),
            transform: item => item.message,
            panelTitle: `${name} - ${selectedPage}`,
            onSuccess: () => {
                setTimeout(() => {
                    setIsLogPanelMinimized(true)
                }, 1000) // minimize on success
                showSuccess(`Deployment ${message} successfully`)
            },
            onFinalize: () => {
                setActiveAction('')
                fetchContainers().then()
            }
        })
    };

    const handleContainerLogs = (containerId: string, containerName: string) => {
        manageStream({
            getStream: signal => dockerService.containerLogs({containerID: containerId}, {signal: signal}),
            transform: item => item.message,
            panelTitle: `Logs - ${containerName}`,
        })
    };

    const manageStream = <T, >(
        {
            getStream,
            transform,
            panelTitle,
            onSuccess,
            onFinalize,
        }: {
            getStream: (signal: AbortSignal) => AsyncIterable<T>;
            transform: (item: T) => string;
            panelTitle: string;
            onSuccess?: () => void;
            onFinalize?: () => void;
        }) => {

        // close prev stream
        abortControllerRef.current?.abort("User started a new action");
        const newController = new AbortController();
        abortControllerRef.current = newController;

        setPanelTitle(panelTitle);

        const sourceStream = getStream(newController.signal);
        const transformedStream = transformAsyncIterable(sourceStream, {
            transform,
            onComplete: () => {
                console.log("Stream completed successfully.");
                onSuccess?.();
            },
            onError: showErrorDialog,
            onFinally: () => {
                if (abortControllerRef.current === newController) {
                    abortControllerRef.current = null;
                }
                onFinalize?.();
            },
        });

        setLogStream(transformedStream);
        setIsLogPanelMinimized(false);
    };

    if (!selectedPage) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                <Typography variant="h5" color="text.secondary">Select a deployment</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default'}}>
            <Box sx={{flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                {/* Action Buttons */}
                <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, flexShrink: 0}}>
                    {deployActionsConfig.map((action) => (
                        <Button
                            key={action.name}
                            variant="outlined"
                            disabled={!!activeAction}
                            onClick={() => handleComposeAction(action.name, action.message, action.rpcName)}
                            startIcon={activeAction === action.name ?
                                <CircularProgress size={20} color="inherit"/> : action.icon}
                        >
                            {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                        </Button>
                    ))}
                </Box>

                <Box sx={{
                    height: '78vh', overflow: 'hidden', border: '3px ridge',
                    borderColor: 'rgba(255, 255, 255, 0.23)', borderRadius: 3, display: 'flex',
                    flexDirection: 'column', backgroundColor: 'rgb(41,41,41)'
                }}>
                    <ContainerTable
                        containers={containers}
                        loading={loading}
                        onShowLogs={handleContainerLogs}
                        setSelectedServices={setSelectedServices}
                        selectedServices={selectedServices}
                        showExec={false}
                    />
                </Box>
            </Box>

            <LogsPanel
                title={panelTitle}
                logStream={logStream}
                isMinimized={isLogPanelMinimized}
                onToggle={() => setIsLogPanelMinimized(prev => !prev)}
            />

            {/* Error Dialog */}
            <Dialog open={composeErrorDialog.dialog} onClose={closeErrorDialog}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Typography
                    sx={{whiteSpace: 'pre-wrap'}}>{composeErrorDialog.message}</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={closeErrorDialog} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

