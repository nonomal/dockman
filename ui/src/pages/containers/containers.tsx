import {Box, Button, CircularProgress} from '@mui/material';
import {Delete, PlayArrow, RestartAlt, Stop, Update} from '@mui/icons-material';
import {ContainerTable} from '../compose/components/container-info-table';
import {useState} from "react";
import {useDockerCompose} from "../../hooks/docker-compose.ts";
import {useSnackbar} from '../../hooks/snackbar.ts';

const deployActionsConfig = [
    {name: 'start', message: "started", icon: <PlayArrow/>},
    {name: 'stop', message: "stopped", icon: <Stop/>},
    {name: 'remove', message: "removed", icon: <Delete/>},
    {name: 'restart', message: "restarted", icon: <RestartAlt/>},
    {name: 'update', message: "updated", icon: <Update/>},
] as const;

function ContainersPage() {
    const {containers, fetchContainers, loading} = useDockerCompose('');
    const {showSuccess} = useSnackbar()

    const [activeAction, setActiveAction] = useState('')
    const [selectedContainers, setSelectedContainers] = useState<string[]>([])

    function handleContainerLogs(containerId: string, containerName: string): void {
        console.log(containerId, containerName)
    }

    function handleComposeAction(name: string, message: string) {
        console.log(name, message)
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
                    <ContainerTable
                        containers={containers}
                        loading={loading}
                        onShowLogs={handleContainerLogs}
                        setSelectedServices={setSelectedContainers}
                        selectedServices={selectedContainers}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default ContainersPage;