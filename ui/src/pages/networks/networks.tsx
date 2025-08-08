import {useMemo} from 'react';
import {
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Delete,
    Refresh as RefreshIcon,
    Storage as StorageIcon,
    Tag as TagIcon,
    Timer
} from '@mui/icons-material';
import {getImageHomePageUrl, useDockerImages} from "../../hooks/docker-images.ts";

function formatBytes(bytes: number | bigint) {
    const bigIntBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
    if (bigIntBytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bigIntBytes) / Math.log(k));

    return parseFloat((bigIntBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp: bigint | number) {
    const bigIntTimestamp = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(bigIntTimestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateId(id: string) {
    return id.length > 12 ? id.substring(0, 12) + '...' : id;
}

const NetworkPage = () => {
    const {images, loading, refreshImages, pruneUnused, totalImageSize} = useDockerImages();

    // Filter and sort images
    const filteredAndSortedImages = useMemo(() => {
        return images
        // todo
        // let filtered = images.filter(image => {
        //     if (!searchTerm) return true;
        //
        //     const searchLower = searchTerm.toLowerCase();
        //     return (
        //         image.id.toLowerCase().includes(searchLower) ||
        //         image.repoTags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        //         image.repoDigests.some(digest => digest.toLowerCase().includes(searchLower))
        //     );
        // });
        //
        // // Sort images
        // filtered.sort((a, b) => {
        //     let aValue, bValue;
        //
        //     switch (sortBy) {
        //         case 'created':
        //             aValue = Number(a.created);
        //             bValue = Number(b.created);
        //             break;
        //         case 'size':
        //             aValue = Number(a.size);
        //             bValue = Number(b.size);
        //             break;
        //         case 'name':
        //             aValue = a.repoTags[0] || a.id;
        //             bValue = b.repoTags[0] || b.id;
        //             break;
        //         default:
        //             aValue = a.id;
        //             bValue = b.id;
        //     }
        //
        //     return (aValue - bValue)
        //
        //     if (sortOrder === 'desc') {
        //         return typeof aValue === 'string' ? bValue.localeCompare(aValue) : bValue - aValue;
        //     } else {
        //         return typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue;
        //     }
        // });
        //
        // return filtered; //todo
    }, [images]);

    const handleRefresh = () => {
        refreshImages();
    };

    const handlePruneUnused = async () => {
        await pruneUnused(true)
    };

    const handlePruneUntagged = async () => {
        await pruneUnused()
    };

    const searchTerm = '';

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
            {/* Header */}
            {/* Header */}
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
                    borderRadius: 2
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
                        {filteredAndSortedImages.length} images • {formatBytes(totalImageSize)}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit"/> : <RefreshIcon/>}
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
                    <Button
                        variant="contained"
                        startIcon={<Delete/>}
                        onClick={handlePruneUntagged}
                        disabled={loading}
                        sx={{minWidth: 140}}
                    >
                        Prune Untagged
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Timer/>}
                        onClick={handlePruneUnused}
                        disabled={loading}
                        sx={{minWidth: 140}}
                    >
                        Prune Unused
                    </Button>
                </Stack>
            </Card>

            {/* Search and Sort Controls */}
            {/*<Paper sx={{p: 2, mb: 1, flexShrink: 0}}>*/}
            {/*    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems="center">*/}
            {/*        <TextField*/}
            {/*            fullWidth*/}
            {/*            placeholder="Search images by ID, tag, or digest..."*/}
            {/*            value={searchTerm}*/}
            {/*            onChange={(e) => setSearchTerm(e.target.value)}*/}
            {/*            slotProps={{*/}
            {/*                input: {*/}
            {/*                    startAdornment: (*/}
            {/*                        <InputAdornment position="start">*/}
            {/*                            <SearchIcon color="action"/>*/}
            {/*                        </InputAdornment>*/}
            {/*                    ),*/}
            {/*                }*/}
            {/*            }}*/}
            {/*            sx={{flexGrow: 0.5}}*/}
            {/*        />*/}
            {/*    </Stack>*/}
            {/*</Paper>*/}

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
                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        flex: 1 // Use flex: 1 instead of height: '100%'
                    }}>
                        <CircularProgress sx={{mr: 2}}/>
                        <Typography variant="body1" color="text.secondary">
                            Loading images...
                        </Typography>
                    </Box>
                ) : filteredAndSortedImages.length === 0 ? (
                    <Paper sx={{
                        p: 6,
                        textAlign: 'center',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <StorageIcon sx={{fontSize: 48, color: 'text.secondary', mb: 2, mx: 'auto'}}/>
                        <Typography variant="h6" sx={{mb: 1}}>
                            {searchTerm ? 'No images found' : 'No images available'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? (
                                'Try adjusting your search criteria.'
                            ) : (
                                <>
                                    Run some apps, treat yourself, {' '}
                                    <Link
                                        href="https://selfh.st/apps/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        https://selfh.st/apps/
                                    </Link>
                                </>
                            )}
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer
                        component={Paper}
                        sx={{
                            height: '100%',
                            overflow: 'auto',
                            // Custom scrollbar styles
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '4px',
                                '&:hover': {
                                    background: 'rgba(0,0,0,0.5)',
                                },
                            },
                            '&::-webkit-scrollbar-corner': {
                                background: 'rgba(0,0,0,0.1)',
                            },
                            // Firefox scrollbar styles
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0,0,0,0.3) rgba(0,0,0,0.1)',
                        }}
                    >
                        <Table stickyHeader sx={{minWidth: 650}}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                                        Image
                                    </TableCell>

                                    <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                                        Size
                                    </TableCell>

                                    <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                                        Shared Size
                                    </TableCell>

                                    <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                                        Containers
                                    </TableCell>

                                    <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                                        Tags
                                    </TableCell>

                                    <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                                        Created
                                    </TableCell>

                                    <TableCell sx={{fontWeight: 'bold', minWidth: 200}}>
                                        Image ID
                                    </TableCell>

                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAndSortedImages.map((image) => (
                                    <TableRow
                                        key={image.id}
                                        hover
                                        sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                    >
                                        <TableCell>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                {image.repoTags.length > 0 ?
                                                    <Tooltip title="Open image website" arrow>
                                                        <Link
                                                            href={getImageHomePageUrl(image.repoTags[0])}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{textDecoration: 'none', color: 'primary.main'}}
                                                            onClick={(event) => event.stopPropagation()} // Prevent row click
                                                        >
                                                            <Typography variant="body2" component="span" sx={{
                                                                wordBreak: 'break-all',
                                                                '&:hover': {textDecoration: 'underline'}
                                                            }}>
                                                                {image.repoTags[0]}
                                                            </Typography>
                                                        </Link>
                                                    </Tooltip> :
                                                    <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                                                        'Untagged'
                                                    </Typography>}
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                                                {formatBytes(image.size)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2">
                                                {Number(image.sharedSize) > 0 ? formatBytes(image.sharedSize) : '—'}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            {Number(image.containers) > 0 ? (
                                                <Chip
                                                    label={`${Number(image.containers)} running`}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    0
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} sx={{flexWrap: 'wrap', gap: 0.5}}>
                                                {image.repoTags.length > 1 ? (
                                                    <>
                                                        {image.repoTags.slice(1, 3).map((tag, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={tag}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                                icon={<TagIcon/>}
                                                                sx={{fontSize: '0.75rem'}}
                                                            />
                                                        ))}
                                                        {image.repoTags.length > 3 && (
                                                            <Chip
                                                                label={`+${image.repoTags.length - 3} more`}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{fontSize: '0.75rem'}}
                                                            />
                                                        )}
                                                    </>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <CalendarIcon sx={{fontSize: 14, mr: 0.5, color: 'text.secondary'}}/>
                                                <Typography variant="body2">
                                                    {formatDate(image.created)}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Tooltip title={image.id} placement="top">
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{fontFamily: 'monospace'}}>
                                                    {truncateId(image.id)}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Box>
    );
};

export default NetworkPage;