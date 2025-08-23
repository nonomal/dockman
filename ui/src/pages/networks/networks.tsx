import {useEffect, useMemo, useRef, useState} from 'react';
import {Box, Button, Card, CircularProgress, Fade, Stack, TextField, Tooltip, Typography} from '@mui/material';
import {Delete, DryCleaning, Refresh, Search} from '@mui/icons-material';
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import NetworksLoading from "./networks-loading.tsx";
import NetworksEmpty from "./networks-empty.tsx";
import {useDockerNetwork} from "../../hooks/docker-networks.ts";
import {NetworkTable} from "./networks-table.tsx";

const NetworksPage = () => {
    const {loading, networks, loadNetworks, networkPrune, deleteSelected} = useDockerNetwork();

    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
    const [activeAction, setActiveAction] = useState('')

    const [search, setSearch] = useState("")
    const searchInputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.altKey && event.key === 'q') {
                event.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const buttonAction = async (callback: () => Promise<void>, actionName: string) => {
        setActiveAction(actionName)
        await callback()
        setActiveAction('')
    }

    const filteredNetworks = useMemo(() => {
        if (search) {
            return networks.filter(vol =>
                vol.id.toLowerCase().includes(search) ||
                vol.name.toLowerCase().includes(search) ||
                vol.driver.toLowerCase().includes(search) ||
                vol.scope.toLowerCase().includes(search)
            )
        }
        return networks;
    }, [search, networks]);

    const actions = [
        {
            action: 'deleteNetworks',
            buttonText: `Delete ${selectedNetworks.length === 0 ? "" : `${selectedNetworks.length}`} networks`,
            icon: <Delete/>,
            disabled: selectedNetworks.length === 0 || loading || !!activeAction,
            handler: async () => {
                deleteSelected(selectedNetworks).then(() => {
                    setSelectedNetworks([])
                })
            },
            tooltip: 'Delete selected networks',
        },
        {
            action: 'deleteUnused',
            buttonText: `Network Prune`,
            icon: <DryCleaning/>,
            disabled: loading || !!activeAction,
            handler: async () => {
                await networkPrune()
            },
            tooltip: 'Equivalent of `docker network prune`',
        },
    ]

    const isEmpty = networks.length === 0;
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            p: 3,
            overflow: 'hidden',
            ...scrollbarStyles
        }}>
            <Card
                sx={{
                    mb: 3,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 3,
                    backgroundColor: 'background.paper',
                    boxShadow: 2,
                    borderRadius: 2,
                    flexShrink: 0,
                }}
            >
                {/* Title and Stats */}
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                    <Typography variant="h6" sx={{fontWeight: 'bold'}}>
                        Docker Networks
                    </Typography>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                    <Typography variant="h6">
                        {networks.length} Networks
                    </Typography>
                </Box>

                <TextField
                    inputRef={searchInputRef}
                    size="small"
                    placeholder={`Search... ALT+Q`}
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
                    }}
                />

                <Tooltip title={loading ? 'Refreshing...' : 'Refresh Networks'}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={loadNetworks}
                        disabled={loading}
                        sx={{minWidth: 'auto', px: 1.5}}
                    >
                        {loading ? <CircularProgress size={16} color="inherit"/> : <Refresh/>}
                    </Button>
                </Tooltip>

                {/* Spacer */}
                <Box sx={{flexGrow: 0.95}}/>

                {/* Actions */}
                <Stack direction="row" spacing={2}>
                    {actions.map((action) => (
                        <Tooltip title={action.tooltip}>
                            <Button
                                variant="contained"
                                onClick={() => buttonAction(action.handler, action.action)}
                                disabled={action.disabled}
                                sx={{minWidth: 140}}
                                startIcon={activeAction === action.action ?
                                    <CircularProgress size={20} color="inherit"/> :
                                    action.icon
                                }
                            >
                                {action.buttonText}
                            </Button>
                        </Tooltip>
                    ))}
                </Stack>
            </Card>

            {/* Table Container */}
            <Box sx={{
                flexGrow: 1,
                border: '3px ridge',
                borderColor: 'rgba(255, 255, 255, 0.23)',
                borderRadius: 3,
                display: 'flex',
                overflow: 'hidden',
                minHeight: 0
            }}>
                {loading ?
                    <NetworksLoading/> :
                    <Fade in={!loading} timeout={300}>
                        <div style={{width: '100%'}}>
                            {isEmpty ?
                                <NetworksEmpty/> :
                                <NetworkTable
                                    networks={filteredNetworks}
                                    selectedNetworks={selectedNetworks}
                                    onSelectionChange={setSelectedNetworks}
                                />
                            }
                        </div>
                    </Fade>
                }
            </Box>
        </Box>
    );
};

export default NetworksPage;
