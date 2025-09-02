import {Box} from '@mui/material';
import {Delete, PlayArrow, RestartAlt, Stop, Update} from '@mui/icons-material';
import {ContainerTable} from '../compose/components/container-info-table';
import {useMemo, useState} from "react";
import {useDockerContainers} from "../../hooks/docker-containers.ts";
import {callRPC, useClient} from "../../lib/api.ts";
import {DockerService} from "../../gen/docker/v1/docker_pb.ts";
import {useSnackbar} from "../../hooks/snackbar.ts";
import LogsDialog from "./logs-dialog.tsx";
// import ContainerExecDialog from "./exec-dialog.tsx";
import SearchBar from "../../components/search-bar.tsx";
import useSearch from "../../hooks/search.ts";
import ActionButtons from "../../components/action-buttons.tsx";

function ContainersPage() {
    const dockerService = useClient(DockerService)
    const {showSuccess, showError} = useSnackbar()
    const {containers, loading, fetchContainers} = useDockerContainers();

    const {search, setSearch, searchInputRef} = useSearch()

    const [selectedContainers, setSelectedContainers] = useState<string[]>([])

    // const [execContainerName, setExecContainerName] = useState("")
    // const [execContainerID, setExecContainerID] = useState("")

    // function handleExecContainerLogs(cid: string, containerName: string): void {
    //     setExecContainerName(containerName)
    //     setExecContainerID(cid)
    // }


    const [containerName, setContainerName] = useState("")
    const [containerID, setContainerID] = useState("")

    function handleContainerLogs(cid: string, containerName: string): void {
        setContainerName(containerName)
        setContainerID(cid)
    }

    const actions = [
        {
            action: 'start',
            buttonText: "Start",
            icon: <PlayArrow/>,
            disabled: selectedContainers.length === 0,
            handler: async () => {
                await handleContainerAction('start', 'containerStart', "started")
            },
            tooltip: "",
        },
        {
            action: 'stop',
            buttonText: "Stop",
            icon: <Stop/>,
            disabled: selectedContainers.length === 0,
            handler: async () => {
                await handleContainerAction('stop', 'containerStop', "stopped")
            },
            tooltip: "",
        },
        {
            action: 'remove',
            buttonText: "Remove",
            icon: <Delete/>,
            disabled: selectedContainers.length === 0,
            handler: async () => {
                await handleContainerAction('remove', 'containerRemove', "removed")
            },
            tooltip: "",
        },
        {
            action: 'restart',
            buttonText: "Restart",
            icon: <RestartAlt/>,
            disabled: selectedContainers.length === 0,
            handler: async () => {
                await handleContainerAction('restart', 'containerRestart', "restarted")
            },
            tooltip: "",
        },
        {
            action: 'update',
            buttonText: "Update",
            icon: <Update/>,
            disabled: selectedContainers.length === 0,
            handler: async () => {
                await handleContainerAction('update', 'containerUpdate', "updated")
            },
            tooltip: "",
        },
    ];

    async function handleContainerAction(
        name: string,
        rpcName: keyof typeof dockerService,
        message: string,
    ) {
        const {err} = await callRPC(
            () => dockerService[rpcName]({
                containerIds: selectedContainers
            }) as Promise<never> // we don't care about the output only err
        )

        if (err) {
            console.error(err)
            showError(`Failed to ${name} Containers: ${err}`)
        } else {
            showSuccess(`Successfully ${message} containers`)
        }

        fetchContainers().then()
        setSelectedContainers([])
    }

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


    return (<>
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
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        mb: 3,
                        flexShrink: 0
                    }}>
                        <SearchBar
                            search={search}
                            setSearch={setSearch}
                            inputRef={searchInputRef}
                        />

                        <ActionButtons
                            actions={actions}
                            variant={"outlined"}
                        />
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
                            useContainerId={true}
                            // showExec={true}
                            // onExec={handleExecContainerLogs}
                        />
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

            {/*<ContainerExecDialog*/}
            {/*    hide={() => {*/}
            {/*        setExecContainerID("")*/}
            {/*        setExecContainerName("")*/}
            {/*    }}*/}
            {/*    show={execContainerID !== ""}*/}
            {/*    containerID={execContainerID}*/}
            {/*    name={execContainerName}*/}
            {/*/>*/}
        </>
    );
}

export default ContainersPage;