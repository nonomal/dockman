import {
    Box,
    Button,
    Card,
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
import {Delete, Refresh as RefreshIcon, Storage as StorageIcon, Timer} from '@mui/icons-material';
import {useDockerNetwork} from "../../hooks/docker-networks.ts";
import scrollbarStyles from "../../components/scrollbar-style.tsx";

const NetworksPage = () => {
    const {loading, networks, loadNetworks} = useDockerNetwork();

    const handleRefresh = () => {
        loadNetworks();
    };

    const handlePruneUnused = async () => {
        // await pruneUnused(true)
    };

    const handlePruneUntagged = async () => {
        // await pruneUnused()
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
                        {networks.length} images • {}
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
                ) : networks.length === 0 ? (
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
                            ...scrollbarStyles,
                        }}
                    >
                        <Table stickyHeader sx={{minWidth: 650}}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                                        Name
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {networks.map((image) => (
                                    <TableRow
                                        key={image.id}
                                        hover
                                        sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                    >
                                        <TableCell>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                {
                                                    <Tooltip title="Open image website" arrow>
                                                        <Typography variant="body2" component="span" sx={{
                                                            wordBreak: 'break-all',
                                                            '&:hover': {textDecoration: 'underline'}
                                                        }}>
                                                            {image.name}
                                                        </Typography>
                                                    </Tooltip>
                                                }
                                            </Box>
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

/**
 * @ts-expect-error some random duplicate export error no idea why
 */
export default NetworksPage;
