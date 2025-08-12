import {Box, Button, CircularProgress} from '@mui/material';
import {Delete, PlayArrow, RestartAlt, Stop, Update} from '@mui/icons-material';
import {ContainerTable} from '../compose/components/container-info-table';
import {useState} from "react";
import {useDockerContainers} from "../../hooks/docker-containers.ts";
import {callRPC, useClient} from "../../lib/api.ts";
import {DockerService} from "../../gen/docker/v1/docker_pb.ts";
import {useSnackbar} from "../../hooks/snackbar.ts";

const deployContainersConfig = [
    {name: 'start', rpcName: 'containerStart', message: "started", icon: <PlayArrow/>},
    {name: 'stop', rpcName: 'containerStop', message: "stopped", icon: <Stop/>},
    {name: 'remove', rpcName: 'containerRemove', message: "removed", icon: <Delete/>},
    {name: 'restart', rpcName: 'containerRestart', message: "restarted", icon: <RestartAlt/>},
    {name: 'update', rpcName: 'containerUpdate', message: "updated", icon: <Update/>},
] as const;

function ContainersPage() {
    const dockerService = useClient(DockerService)
    const {showSuccess, showError} = useSnackbar()
    const {containers, loading} = useDockerContainers();

    const [activeAction, setActiveAction] = useState('')
    const [selectedContainers, setSelectedContainers] = useState<string[]>([])

    function handleContainerLogs(containerId: string, containerName: string): void {
        // todo
        console.log(containerId, containerName)
    }

    async function handleContainerAction(
        name: typeof deployContainersConfig[number]['name'],
        rpcName: typeof deployContainersConfig[number]['rpcName'],
        message: string,
    ) {
        setActiveAction(name)

        const {err} = await callRPC(
            () => dockerService[rpcName](
                {containerIds: selectedContainers}
            )
        )
        if (err) {
            console.error(err)
            showError(`Failed to ${name} Containers: ${err}`)
        }

        showSuccess(`Successfully ${message} containers`)
        setActiveAction('')
        setSelectedContainers([])
    }

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.default'
        }}>
            <Box sx={{
                flexGrow: 1,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Action Buttons */}
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 3,
                    flexShrink: 0
                }}>
                    {deployContainersConfig.map((action) => (
                        <Button
                            key={action.name}
                            variant="outlined"
                            disabled={!!activeAction}
                            onClick={() => handleContainerAction(action.name, action.rpcName, action.message)}
                            startIcon={activeAction === action.name ?
                                <CircularProgress size={20} color="inherit"/> : action.icon}
                        >
                            {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                        </Button>
                    ))}
                </Box>

                <Box sx={{
                    height: '83vh', overflow: 'hidden', border: '2px dashed',
                    borderColor: 'rgba(255, 255, 255, 0.23)', borderRadius: 3, display: 'flex',
                    flexDirection: 'column', backgroundColor: 'rgb(41,41,41)'
                }}>
                    <ContainerTable
                        containers={containers}
                        loading={loading}
                        onShowLogs={handleContainerLogs}
                        setSelectedServices={setSelectedContainers}
                        selectedServices={selectedContainers}
                        useContainerId={true}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default ContainersPage;