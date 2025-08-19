import {useState} from 'react';
import {
    Box,
    Checkbox,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography
} from '@mui/material';
import {FolderOpen as FolderIcon, Label as LabelIcon, Storage as StorageIcon} from '@mui/icons-material';
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import type {Network} from "../../gen/docker/v1/docker_pb.ts";
import {useCopyButton} from "../../hooks/copy.ts";
import CopyButton from "../../components/copy-button.tsx";

type SortField = 'project' | 'size' | 'inuse' | 'name' | 'mountPoint' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface NetworkTableProps {
    networks: Network[];
    selectedNetworks?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const NetworkTable = ({networks, selectedNetworks = [], onSelectionChange}: NetworkTableProps) => {
    const [sortField, setSortField] = useState<SortField>('project');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedNetworks = [...networks].sort(() => {
        let aValue: string | Date, bValue: string | Date;

        switch (sortField) {
            default:
                return 0;
        }

        let result: number;
        if (aValue instanceof Date && bValue instanceof Date) {
            // result = aValue.getTime() - bValue.getTime();
        } else {
            result = String(aValue).localeCompare(String(bValue));
        }

        return sortOrder === 'asc' ? result : -result;
    });

    const {handleCopy, copiedId} = useCopyButton()

    // Handle individual row selection
    const handleRowSelection = (volumeName: string) => {
        if (!onSelectionChange) return;

        const newSelection = selectedNetworks.includes(volumeName)
            ? selectedNetworks.filter(name => name !== volumeName)
            : [...selectedNetworks, volumeName];

        onSelectionChange(newSelection);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allSelected = selectedNetworks.length === networks.length;
        const newSelection = allSelected ? [] : networks.map(vol => vol.id);
        onSelectionChange(newSelection);
    };

    const isAllSelected = selectedNetworks.length === networks.length && networks.length > 0;
    const isIndeterminate = selectedNetworks.length > 0 && selectedNetworks.length < networks.length;

    return (
        <TableContainer
            component={Paper}
            sx={{
                height: '100%',
                overflow: 'auto',
                ...scrollbarStyles
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

                        <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                            <TableSortLabel
                                active={sortField === 'project'}
                                direction={sortField === 'project' ? sortOrder : 'asc'}
                                onClick={() => handleSort('project')}
                            >
                                Project
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold'}}>
                            <TableSortLabel
                                active={sortField === 'name'}
                                direction={sortField === 'name' ? sortOrder : 'asc'}
                                onClick={() => handleSort('name')}
                            >
                                Network Name
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 120}}>
                            <TableSortLabel
                                active={sortField === 'size'}
                                direction={sortField === 'size' ? sortOrder : 'asc'}
                                onClick={() => handleSort('size')}
                            >
                                Size
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 120}}>
                            <TableSortLabel
                                active={sortField === 'inuse'}
                                direction={sortField === 'inuse' ? sortOrder : 'asc'}
                                onClick={() => handleSort('inuse')}
                            >
                                In Use
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 200}}>
                            <TableSortLabel
                                active={sortField === 'mountPoint'}
                                direction={sortField === 'mountPoint' ? sortOrder : 'asc'}
                                onClick={() => handleSort('mountPoint')}
                            >
                                Mount Point
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                            <TableSortLabel
                                active={sortField === 'createdAt'}
                                direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                                onClick={() => handleSort('createdAt')}
                            >
                                Created
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedNetworks.map((network) => (
                        <TableRow
                            key={network.name}
                            hover
                            sx={{
                                '&:last-child td, &:last-child th': {border: 0},
                                cursor: 'pointer',
                                backgroundColor: selectedNetworks.includes(network.name)
                                    ? 'rgba(25, 118, 210, 0.08)'
                                    : 'transparent'
                            }}
                            onClick={() => handleRowSelection(network.id)}
                        >
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedNetworks.includes(network.id)}
                                    onChange={() => handleRowSelection(network.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </TableCell>

                            <TableCell>
                                {network.name ? (
                                    <Chip
                                        label={`${network.name}`}
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        icon={<LabelIcon/>}
                                        sx={{fontSize: '0.75rem'}}
                                    />
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        —
                                    </Typography>
                                )}
                            </TableCell>

                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <Box sx={{flex: 1}}>
                                        <Typography variant="body2" sx={{
                                            wordBreak: 'break-all',
                                            fontWeight: 'medium'
                                        }}>
                                            {network.name}
                                        </Typography>
                                    </Box>
                                    <CopyButton
                                        handleCopy={handleCopy}
                                        thisID={network.name}
                                        activeID={copiedId ?? ""}
                                        tooltip={"Copy Network name"}
                                    />
                                </Box>
                            </TableCell>

                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <StorageIcon sx={{fontSize: 18, color: 'text.secondary'}}/>
                                    <Box sx={{flex: 1}}>
                                        <Typography variant="body2" sx={{
                                            wordBreak: 'break-all',
                                            fontWeight: 'medium'
                                        }}>
                                        </Typography>
                                    </Box>
                                </Box>
                            </TableCell>

                            <TableCell>
                                {network.id ? (
                                    <Chip
                                        label={`in use`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                ) : (
                                    <Chip
                                        label={`unused`}
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                    />)}
                            </TableCell>

                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <FolderIcon sx={{fontSize: 16, color: 'text.secondary'}}/>
                                    <Typography variant="body2" sx={{
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem'
                                    }}>
                                        {network.scope}
                                    </Typography>
                                </Box>
                            </TableCell>


                            <TableCell>
                                {/*<Box sx={{display: 'flex', alignItems: 'center'}}>*/}
                                {/*    <CalendarIcon sx={{fontSize: 14, mr: 0.5, color: 'text.secondary'}}/>*/}
                                {/*    <Typography variant="body2">*/}
                                {/*        {formatDate(network.CreatedAt)}*/}
                                {/*    </Typography>*/}
                                {/*</Box>*/}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};