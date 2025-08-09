import {useState} from 'react';
import {Box, Button, Card, CircularProgress, Stack, Tooltip, Typography} from '@mui/material';
import {Delete, Refresh, Timer} from '@mui/icons-material';
import {useDockerImages} from "../../hooks/docker-images.ts";
import {ImagesEmpty} from "./images-empty.tsx";
import {ImageTable} from './images-table.tsx';
import {formatBytes} from "../../lib/editor.ts";
import {ImagesLoading} from "./images-loading.tsx";

const ImagesPage = () => {
    const {
        images,
        loading,
        refreshImages,
        pruneUnused,
        totalImageSize,
        unusedContainerCount,
        untagged,
        deleteImages
    } = useDockerImages();

    const [selectedImages, setSelectedImages] = useState<string[]>([])

    const handleRefresh = () => {
        refreshImages();
    };

    const handlePruneUnused = async () => {
        await pruneUnused(true)
    };

    const handlePruneUntagged = async () => {
        await pruneUnused()
    };

    const handleDelete = async () => {
        await deleteImages(selectedImages)
        setSelectedImages([])
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            p: 3,
            overflow: 'hidden',
            // Global scrollbar styles for any nested scrollable elements
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
                        Docker Images
                    </Typography>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                    <Typography variant="h6">
                        {images.length} images • {formatBytes(totalImageSize) ?? '0B'}
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

                    <Tooltip title={"Remove selected images"}>
                        <Button
                            variant="contained"
                            startIcon={<Timer/>}
                            onClick={handleDelete}
                            disabled={loading}
                            sx={{minWidth: 140}}
                        >
                            Delete {selectedImages.length === 0 ? "" : `${selectedImages.length}`} images
                        </Button>
                    </Tooltip>

                    <Tooltip title={"Remove untagged images"}>
                        <Button
                            variant="contained"
                            startIcon={<Delete/>}
                            onClick={handlePruneUntagged}
                            disabled={loading}
                            sx={{minWidth: 140}}
                        >
                            Prune Untagged ({untagged})
                        </Button>
                    </Tooltip>

                    <Tooltip title={"Remove unused images"}>
                        <Button
                            variant="contained"
                            startIcon={<Timer/>}
                            onClick={handlePruneUnused}
                            disabled={loading}
                            sx={{minWidth: 140}}
                        >
                            Prune Unused ({unusedContainerCount})
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
                minHeight: 0 // Add this to ensure flex child can shrink
            }}>
                {loading ?
                    <ImagesLoading/> :
                    images.length === 0 ?
                        <ImagesEmpty searchTerm={''}/> :
                        <ImageTable
                            selectedImages={selectedImages}
                            onSelectionChange={setSelectedImages}
                        />
                }
            </Box>
        </Box>
    )
};

export default ImagesPage;