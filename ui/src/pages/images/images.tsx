import {useEffect, useMemo, useRef, useState} from 'react';
import {Box, Button, Card, CircularProgress, Fade, Stack, TextField, Tooltip, Typography} from '@mui/material';
import {CleaningServices, Delete, Refresh, Sanitizer, Search} from '@mui/icons-material';
import {useDockerImages} from "../../hooks/docker-images.ts";
import {ImagesEmpty} from "./images-empty.tsx";
import {ImageTable} from './images-table.tsx';
import {formatBytes} from "../../lib/editor.ts";
import {ImagesLoading} from "./images-loading.tsx";
import scrollbarStyles from "../../components/scrollbar-style.tsx";

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

    const filteredImages = useMemo(() => {
        if (search) {
            return images.filter(image =>
                image.repoTags[0]
                    .toLowerCase()
                    .includes(search))
        }
        return images;
    }, [images, search]);

    const actions = [
        {
            action: 'deleteSelected',
            buttonText: `Delete ${selectedImages.length === 0 ? "" : `${selectedImages.length}`} images`,
            icon: <Delete/>,
            disabled: loading || !!activeAction || selectedImages.length === 0,
            handler: async () => {
                await deleteImages(selectedImages)
                setSelectedImages([])
            },
            tooltip: 'Delete selected images',
        },
        {
            action: 'deleteUntagged',
            buttonText: `Prune Untagged (${untagged})`,
            icon: <Sanitizer/>,
            disabled: loading || !!activeAction,
            handler: async () => {
                await pruneUnused()
            },
            tooltip: 'Delete Untagged images',
        },
        {
            action: 'deleteUnused',
            buttonText: `Prune Unused (${unusedContainerCount})`,
            tooltip: 'Delete all unused images',
            icon: <CleaningServices/>,
            disabled: loading || !!activeAction,
            handler: async () => {
                await pruneUnused(true)
            },
        }
    ]

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
                        Docker Images
                    </Typography>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
                    <Typography variant="h6">
                        {images.length} images • {formatBytes(totalImageSize) ?? '0B'}
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

                <Tooltip title={loading ? 'Refreshing...' : 'Refresh images'}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={refreshImages}
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
                                    <CircularProgress size={20} color="inherit"/> : action.icon}
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
                {loading ? (
                    <ImagesLoading/>
                ) : (
                    <Fade in={!loading} timeout={300}>
                        <div style={{width: '100%'}}>
                            {images.length === 0 ? (
                                <ImagesEmpty searchTerm={''}/>
                            ) : (
                                <ImageTable
                                    images={filteredImages}
                                    selectedImages={selectedImages}
                                    onSelectionChange={setSelectedImages}
                                />
                            )}
                        </div>
                    </Fade>
                )}
            </Box>
        </Box>
    )
};

export default ImagesPage;