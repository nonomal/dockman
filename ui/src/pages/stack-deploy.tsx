import {useState} from 'react';
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
import {type ContainerLogStream, DockerService} from "../gen/docker/v1/docker_pb.ts";
import {useClient} from '../lib/api.ts';
import {useDockerContainers} from "../hooks/containers.ts";
import {useDockerActions} from "../hooks/docker-actions.ts";
import {ContainerTable} from "../components/container-info-table.tsx";
import {LogsPanel} from "../components/logs-panel.tsx";

interface DeployPageProps {
    selectedPage: string;
}

const deployActionsConfig = [
    {name: 'start', message: "started", icon: <PlayArrowIcon/>},
    {name: 'stop', message: "stopped", icon: <StopIcon/>},
    {name: 'remove', message: "removed", icon: <DeleteIcon/>},
    {name: 'restart', message: "restarted", icon: <RestartAltIcon/>},
    {name: 'update', message: "updated", icon: <UpdateIcon/>},
] as const;

export function StackDeploy({selectedPage}: DeployPageProps) {
    const dockerService = useClient(DockerService);
    const {containers, refresh: refreshContainers} = useDockerContainers(selectedPage);
    const {
        activeAction,
        actionError,
        actionLogStream,
        logTitle,
        performAction,
        clearActionError,
        setActionLogStream,
        setLogTitle
    } = useDockerActions();

    const [isLogPanelMinimized, setIsLogPanelMinimized] = useState(true);

    // State for individual container logs, separate from compose action logs
    const [containerLogStream, setContainerLogStream] = useState<AsyncIterable<ContainerLogStream> | null>(null);

    const handleComposeAction = (name: typeof deployActionsConfig[number]['name'], message: string) => {
        setIsLogPanelMinimized(false)
        performAction(
            name,
            () => dockerService[name]({filename: selectedPage}),
            message,
            selectedPage
        ).then(() => {
            refreshContainers()
            if (!actionError) {
                // hide on success
                setTimeout(() => setIsLogPanelMinimized(true), 1000)
            }
        });
    };

    const handleShowContainerLogs = (containerId: string, containerName: string) => {
        setLogTitle(`Logs - ${containerName}`);
        // Clear compose action stream if active
        if (actionLogStream) setActionLogStream(null);
        // Set the individual container log stream
        setContainerLogStream(dockerService.logs({containerID: containerId}));
        setIsLogPanelMinimized(false);
    };

    // Determine which stream to pass to the logs panel
    const currentLogStream = actionLogStream || containerLogStream;

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
                    <ContainerTable containers={containers} onShowLogs={handleShowContainerLogs}/>
                </Box>
            </Box>

            <LogsPanel
                title={logTitle}
                logStream={currentLogStream}
                isMinimized={isLogPanelMinimized}
                onToggle={() => setIsLogPanelMinimized(prev => !prev)}
                onClose={() => setIsLogPanelMinimized(true)}
            />

            {/* Error Dialog */}
            <Dialog open={!!actionError} onClose={clearActionError}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Typography sx={{whiteSpace: 'pre-wrap'}}>{actionError}</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={clearActionError} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}