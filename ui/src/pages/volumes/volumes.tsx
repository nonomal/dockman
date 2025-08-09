import {useState} from 'react';
import {Box, Button, Card, CircularProgress, Stack, Tooltip, Typography} from '@mui/material';
import {Delete, Refresh, Timer} from '@mui/icons-material';
import {useDockerVolumes} from "../../hooks/docker-volumes.ts";
import {VolumeTable} from './volumes-table.tsx';

const VolumesPage = () => {
    const {loadVolumes, volumes, loading} = useDockerVolumes();
    const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);

    const handleRefresh = () => {
        loadVolumes();
    };

    const handleDelete = async () => {
        // Implement delete functionality
        console.log('Deleting volumes:', selectedVolumes);
        setSelectedVolumes([]);
    };

    const handlePruneUnused = async () => {
        // Implement prune unused volumes functionality
        console.log('Pruning unused volumes');
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            p: 3,
            overflow: 'hidden',
            '& *::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
            },
            '& *::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
            },
            '& *::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                    background: 'rgba(0,0,0,0.4)',
                },
                '&:active': {
                    background: 'rgba(0,0,0,0.6)',
                },
            },
            '& *::-webkit-scrollbar-corner': {
                background: 'rgba(0,0,0,0.05)',
            },
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

                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit"/> : <Refresh/>}
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{minWidth: 100}}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </Button>

                {/* Spacer */}
                <Box sx={{flexGrow: 0.95}}/>

                {/* Actions */}
                <Stack direction="row" spacing={2}>
                    <Tooltip title="Remove selected volumes">
                        <Button
                            variant="contained"
                            startIcon={<Delete/>}
                            onClick={handleDelete}
                            disabled={loading || selectedVolumes.length === 0}
                            sx={{minWidth: 140}}
                        >
                            Delete {selectedVolumes.length === 0 ? "" : `${selectedVolumes.length}`} volumes
                        </Button>
                    </Tooltip>

                    <Tooltip title="Remove unused volumes">
                        <Button
                            variant="contained"
                            startIcon={<Timer/>}
                            onClick={handlePruneUnused}
                            disabled={loading}
                            sx={{minWidth: 140}}
                        >
                            Prune Unused
                        </Button>
                    </Tooltip>
                </Stack>
            </Card>

            {/* Table Container */}
            <Box sx={{
                flexGrow: 1,
                border: '2px dashed',
                borderColor: 'rgba(255, 255, 255, 0.23)',
                borderRadius: 3,
                display: 'flex',
                overflow: 'hidden',
                minHeight: 0
            }}>
                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%'
                    }}>
                        <CircularProgress/>
                    </Box>
                ) : volumes.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                        textAlign: 'center',
                        gap: 2
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            No volumes found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create some Docker volumes to see them here
                        </Typography>
                    </Box>
                ) : (
                    <VolumeTable
                        volumes={volumes}
                        selectedVolumes={selectedVolumes}
                        onSelectionChange={setSelectedVolumes}
                    />
                )}
            </Box>
        </Box>
    );
};

export default VolumesPage;
