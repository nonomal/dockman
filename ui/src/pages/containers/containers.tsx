import {Box, Button, CircularProgress, TextField} from '@mui/material';
import {Delete, PlayArrow, RestartAlt, Search, Stop} from '@mui/icons-material';
import {ContainerTable} from '../compose/components/container-info-table';
import {useEffect, useMemo, useRef, useState} from "react";
import {useDockerContainers} from "../../hooks/docker-containers.ts";
import {callRPC, useClient} from "../../lib/api.ts";
import {DockerService} from "../../gen/docker/v1/docker_pb.ts";
import {useSnackbar} from "../../hooks/snackbar.ts";
import LogsDialog from "./logs-dialog.tsx";

const deployContainersConfig = [
    {name: 'start', rpcName: 'containerStart', message: "started", icon: <PlayArrow/>},
    {name: 'stop', rpcName: 'containerStop', message: "stopped", icon: <Stop/>},
    {name: 'remove', rpcName: 'containerRemove', message: "removed", icon: <Delete/>},
    {name: 'restart', rpcName: 'containerRestart', message: "restarted", icon: <RestartAlt/>},
    // todo update
    // {name: 'update', rpcName: 'containerUpdate', message: "updated", icon: <Update/>},
] as const;

function ContainersPage() {
    const dockerService = useClient(DockerService)
    const {showSuccess, showError} = useSnackbar()
    const {containers, loading, fetchContainers} = useDockerContainers();

    const [activeAction, setActiveAction] = useState('')
    const [selectedContainers, setSelectedContainers] = useState<string[]>([])

    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.altKey && event.key === 'q') {
                event.preventDefault()
                console.log("keyDown", event.key)
                searchInputRef.current?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const [containerName, setContainerName] = useState("")
    const [containerID, setContainerID] = useState("")

    function handleContainerLogs(cid: string, containerName: string): void {
        setContainerName(containerName)
        setContainerID(cid)
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

        fetchContainers().then()
        showSuccess(`Successfully ${message} containers`)
        setActiveAction('')
        setSelectedContainers([])
    }

    const [search, setSearch] = useState("")

    const filteredContainers = useMemo(() => {
        const lowerSearch = search.toLowerCase()

        if (search) {
            return containers.filter(cont =>
                cont.serviceName.toLowerCase().includes(lowerSearch) ||
                cont.imageName.toLowerCase().includes(lowerSearch) ||
                cont.stackName.toLowerCase().includes(lowerSearch) ||
                cont.name.toLowerCase().includes(lowerSearch)
            )
        }
        return containers;
    }, [containers, search]);


    return (
        <><Box sx={{
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
                    <TextField
                        inputRef={searchInputRef}
                        size="small"
                        placeholder="Search... ALT+Q"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: <Search sx={{mr: 1, color: 'action.active'}}/>,
                            }
                        }}
                        sx={{
                            minWidth: 250,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            }
                        }}/>

                    {deployContainersConfig.map((action) => (
                        <Button
                            key={action.name}
                            variant="outlined"
                            disabled={!!activeAction || selectedContainers.length === 0}
                            onClick={() => handleContainerAction(action.name, action.rpcName, action.message)}
                            startIcon={activeAction === action.name ?
                                <CircularProgress size={20} color="inherit"/> : action.icon}
                        >
                            {action.name.charAt(0).toUpperCase() + action.name.slice(1)}
                        </Button>
                    ))}
                </Box>

                <Box sx={{
                    height: '83vh', overflow: 'hidden', border: '3px ridge',
                    borderColor: 'rgba(255, 255, 255, 0.23)', borderRadius: 3, display: 'flex',
                    flexDirection: 'column', backgroundColor: 'rgb(41,41,41)'
                }}>
                    <ContainerTable
                        containers={filteredContainers}
                        loading={loading}
                        onShowLogs={handleContainerLogs}
                        setSelectedServices={setSelectedContainers}
                        selectedServices={selectedContainers}
                        useContainerId={true}/>
                </Box>
            </Box>
        </Box>

            <LogsDialog
                hide={() => {
                    setContainerID("")
                    setContainerName("")
                }}
                show={containerID !== ""}
                containerID={containerID}
                name={containerName}
            />
        </>
    );
}

export default ContainersPage;