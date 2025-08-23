import {useEffect, useMemo, useRef, useState} from 'react';
import {Box, Button, Card, CircularProgress, Fade, Stack, TextField, Tooltip, Typography} from '@mui/material';
import {CleaningServices, Delete, DryCleaning, Refresh, Search} from '@mui/icons-material';
import {useDockerVolumes} from "../../hooks/docker-volumes.ts";
import {VolumeTable} from './volumes-table.tsx';
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import VolumesLoading from "./volumes-loading.tsx";
import VolumesEmpty from "./volumes-empty.tsx";

const VolumesPage = () => {
    const {loadVolumes, volumes, loading, deleteAnonynomous, deleteSelected, deleteUnunsed} = useDockerVolumes();
    const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);
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

    const filteredVolumes = useMemo(() => {
        if (search) {
            return volumes.filter(vol =>
                vol.name.toLowerCase().includes(search) ||
                vol.containerID.toLowerCase().includes(search) ||
                vol.labels.toLowerCase().includes(search) ||
                vol.mountPoint.toLowerCase().includes(search)
            )
        }
        return volumes;
    }, [search, volumes]);

    const actions = [
        {
            action: 'deleteSelected',
            buttonText: `Delete ${selectedVolumes.length === 0 ? "" : `${selectedVolumes.length}`} volumes`,
            icon: <Delete/>,
            disabled: selectedVolumes.length === 0 || loading || !!activeAction,
            handler: async () => {
                await deleteSelected(selectedVolumes)
                setSelectedVolumes([])
            },
            tooltip: 'Delete selected volumes',
        },
        {
            action: 'deleteUnused',
            buttonText: `Prune Unused`,
            icon: <DryCleaning/>,
            disabled: loading || !!activeAction,
            handler: deleteUnunsed,
            tooltip: 'Delete unused images',
        },
        {
            action: 'deleteAnon',
            buttonText: `Prune Anonymous`,
            icon: <CleaningServices/>,
            disabled: loading || !!activeAction,
            handler: deleteAnonynomous,
            tooltip: 'Delete anonymous images',
        },
    ]

    const isEmpty = volumes.length === 0;
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
                        Docker Volumes
                    </Typography>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                    <Typography variant="h6">
                        {volumes.length} volumes
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

                <Tooltip title={loading ? 'Refreshing...' : 'Refresh volumes'}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={loadVolumes}
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
                    <VolumesLoading/> :
                    <Fade in={!loading} timeout={300}>
                        <div style={{width: '100%'}}>
                            {isEmpty ?
                                <VolumesEmpty/> :
                                <VolumeTable
                                    volumes={filteredVolumes}
                                    selectedVolumes={selectedVolumes}
                                    onSelectionChange={setSelectedVolumes}
                                />
                            }
                        </div>
                    </Fade>
                }
            </Box>
        </Box>
    );
};

export default VolumesPage;
