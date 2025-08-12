import {
    Box,
    Button,
    Card,
    Checkbox,
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
import {Refresh as RefreshIcon, Storage as StorageIcon} from '@mui/icons-material';
import {useDockerNetwork} from "../../hooks/docker-networks.ts";
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import type {Network} from "../../gen/docker/v1/docker_pb.ts";
import {useState} from "react";

const NetworksPage = () => {
    const {loading, networks, loadNetworks} = useDockerNetwork();

    const handleRefresh = () => {
        loadNetworks();
    };

    // const handlePruneUnused = async () => {
    //     // await pruneUnused(true)
    // };
    //
    // const handlePruneUntagged = async () => {
    //     // await pruneUnused()
    // };

    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([])


    const searchTerm = '';

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
                    {/*<Button*/}
                    {/*    variant="contained"*/}
                    {/*    startIcon={<Delete/>}*/}
                    {/*    onClick={handlePruneUntagged}*/}
                    {/*    disabled={loading}*/}
                    {/*    sx={{minWidth: 140}}*/}
                    {/*>*/}
                    {/*    Prune Untagged*/}
                    {/*</Button>*/}

                    {/*<Button*/}
                    {/*    variant="contained"*/}
                    {/*    startIcon={<Timer/>}*/}
                    {/*    onClick={handlePruneUnused}*/}
                    {/*    disabled={loading}*/}
                    {/*    sx={{minWidth: 140}}*/}
                    {/*>*/}
                    {/*    Prune Unused*/}
                    {/*</Button>*/}
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
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        flex: 1
                    }}>
                        <CircularProgress sx={{mr: 2}}/>
                        <Typography variant="body1" color="text.secondary">
                            Loading Networks...
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
                    ) :
                    <NetworkTable
                        networks={networks}
                        onSelectionChange={setSelectedNetworks}
                        selectedNetworks={selectedNetworks}
                    />
                }
            </Box>
        </Box>
    );
};

interface NetworkTableProps {
    networks: Network[];
    selectedNetworks: string[];
    onSelectionChange: (selectedIds: string[]) => void;
}

const NetworkTable = ({networks, onSelectionChange, selectedNetworks}: NetworkTableProps) => {
    const isAllSelected = selectedNetworks.length === networks.length && networks.length > 0;
    const isIndeterminate = selectedNetworks.length > 0 && selectedNetworks.length < networks.length;

    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allSelected = selectedNetworks.length === networks.length;
        const newSelection = allSelected ? [] : networks.map(img => img.id);
        onSelectionChange(newSelection);
    };

    const handleRowSelection = (imageId: string) => {
        if (!onSelectionChange) return;

        const newSelection = selectedNetworks.includes(imageId)
            ? selectedNetworks.filter(id => id !== imageId)
            : [...selectedNetworks, imageId];

        onSelectionChange(newSelection);
    };

    return (
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
                        <TableCell padding="checkbox">
                            <Checkbox
                                indeterminate={isIndeterminate}
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                            />
                        </TableCell>
                        <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                            Name
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {networks.map((net) => (
                        <TableRow
                            key={net.id}
                            hover
                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                        >
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedNetworks.includes(net.id)}
                                    onChange={() => handleRowSelection(net.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </TableCell>

                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    {
                                        <Tooltip title="Open image website" arrow>
                                            <Typography variant="body2" component="span" sx={{
                                                wordBreak: 'break-all',
                                                '&:hover': {textDecoration: 'underline'}
                                            }}>
                                                {net.name}
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
    );
};

export default NetworksPage;
