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
import {useClient} from '../lib/api.ts';
import {useDockerContainers} from "../hooks/containers.ts";
import {ContainerTable} from "../components/container-info-table.tsx";
import {LogsPanel} from "../components/logs-panel.tsx";
import {useSnackbar} from "../hooks/snackbar.ts";
import {Code, ConnectError} from "@connectrpc/connect";
import {DockerService} from "../gen/docker/v1/docker_pb.ts";

const deployActionsConfig = [
    {name: 'start', message: "started", icon: <PlayArrowIcon/>},
    {name: 'stop', message: "stopped", icon: <StopIcon/>},
    {name: 'remove', message: "removed", icon: <DeleteIcon/>},
    {name: 'restart', message: "restarted", icon: <RestartAltIcon/>},
    {name: 'update', message: "updated", icon: <UpdateIcon/>},
] as const;

interface DeployPageProps {
    selectedPage: string;
}

export function StackDeploy({selectedPage}: DeployPageProps) {
    const dockerService = useClient(DockerService);
    const {containers, refresh: refreshContainers} = useDockerContainers(selectedPage);
    const {showSuccess} = useSnackbar()
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const [panelTitle, setPanelTitle] = useState("Logs")
    const [isLogPanelMinimized, setIsLogPanelMinimized] = useState(true);

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

    const [logStream, setLogStream] = useState<AsyncIterable<string> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            // If there's an active controller when the component unmounts, abort it.
            abortControllerRef.current?.abort("Component unmounted");
        };
    }, []); // Empty dependency array means this runs only on mount and unmount

    const handleComposeAction = (name: typeof deployActionsConfig[number]['name'], message: string) => {
        setActiveAction(name)

        manageStream({
            getStream: signal => dockerService[name]({filename: selectedPage}, {signal: signal}),
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
                refreshContainers().then()
            }
        })
    };

    const handleContainerLogs = (containerId: string, containerName: string) => {
        manageStream({
            getStream: signal => dockerService.logs({containerID: containerId}, {signal: signal}),
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
                            onClick={() => handleComposeAction(action.name, action.message)}
                            startIcon={activeAction === action.name ?
                                <CircularProgress size={20} color="inherit"/> : action.icon}
                        >
                            {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                        </Button>
                    ))}
                </Box>

                <Box sx={{
                    height: '78vh', overflow: 'hidden', border: '2px dashed',
                    borderColor: 'rgba(255, 255, 255, 0.23)', borderRadius: 3, display: 'flex',
                    flexDirection: 'column', backgroundColor: 'rgb(41,41,41)'
                }}>
                    <ContainerTable containers={containers} onShowLogs={handleContainerLogs}/>
                </Box>
            </Box>

            <LogsPanel
                title={panelTitle}
                logStream={logStream}
                isMinimized={isLogPanelMinimized}
                onToggle={() => setIsLogPanelMinimized(prev => !prev)}
                onClose={() => setIsLogPanelMinimized(true)}
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


interface TransformAsyncIterableOptions<T, U> {
    transform: (item: T) => U | Promise<U>;
    onComplete?: () => void;
    onError?: (error: string) => void;
    onFinally?: () => void;
}

/**
 * A generic function to transform items from a source async iterable,
 * with callbacks for handling completion, errors, and final cleanup.
 *
 * @param source The source async iterable.
 * @param options An object containing the transform function and optional lifecycle callbacks.
 * @returns A new async iterable with transformed items.
 */
async function* transformAsyncIterable<T, U>(
    source: AsyncIterable<T>,
    options: TransformAsyncIterableOptions<T, U>
): AsyncIterable<U> {
    const {transform, onComplete, onError, onFinally} = options;

    try {
        for await (const item of source) {
            yield await transform(item);
        }
        // The stream completed without any errors.
        onComplete?.();
    } catch (error: unknown) {
        if (error instanceof ConnectError && error.code === Code.Canceled) {
            console.log("Stream was cancelled:", error.message);
            return; // Don't show an error dialog for user-cancellation.
        }

        let errMessage = "An error occurred while streaming.";
        if (error instanceof ConnectError) {
            errMessage += `\n${error.code} ${error.name}: ${error.message}`;
        } else if (error instanceof Error) {
            errMessage += `\nUnknown Error: ${error.toString()}`;
        }

        onError?.(errMessage);
    } finally {
        onFinally?.();
    }
}
