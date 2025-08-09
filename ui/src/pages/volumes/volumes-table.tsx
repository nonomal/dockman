import React, { useCallback, useState } from 'react';
import {
    Box,
    Checkbox,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Tooltip,
    Typography
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    CopyAll,
    FolderOpen as FolderIcon,
    Label as LabelIcon,
    Storage as StorageIcon
} from '@mui/icons-material';

export type Volume = {
    CreatedAt: string;
    Driver: string;
    Labels: {
        [p: string]: string;
    };
    MountPoint: string;
    Name: string;
    Scope: string;
};

type SortField = 'name' | 'driver' | 'mountPoint' | 'scope' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface VolumeTableProps {
    volumes: Volume[];
    selectedVolumes?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const VolumeTable = ({ volumes, selectedVolumes = [], onSelectionChange }: VolumeTableProps) => {
    const [sortField, setSortField] = useState<SortField>('createdAt');
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

    // Sort volumes based on current sort field and order
    const sortedVolumes = [...volumes].sort((a, b) => {
        let aValue: string | Date, bValue: string | Date;

        switch (sortField) {
            case 'name':
                aValue = a.Name;
                bValue = b.Name;
                break;
            case 'driver':
                aValue = a.Driver;
                bValue = b.Driver;
                break;
            case 'mountPoint':
                aValue = a.MountPoint;
                bValue = b.MountPoint;
                break;
            case 'scope':
                aValue = a.Scope;
                bValue = b.Scope;
                break;
            case 'createdAt':
                aValue = new Date(a.CreatedAt);
                bValue = new Date(b.CreatedAt);
                break;
            default:
                return 0;
        }

        let result: number;
        if (aValue instanceof Date && bValue instanceof Date) {
            result = aValue.getTime() - bValue.getTime();
        } else {
            result = String(aValue).localeCompare(String(bValue));
        }

        return sortOrder === 'asc' ? result : -result;
    });

    // Handle copy volume name or mount point
    const handleCopyText = useCallback(async (text: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text copied to clipboard');
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    }, []);

    // Handle individual row selection
    const handleRowSelection = (volumeName: string) => {
        if (!onSelectionChange) return;

        const newSelection = selectedVolumes.includes(volumeName)
            ? selectedVolumes.filter(name => name !== volumeName)
            : [...selectedVolumes, volumeName];

        onSelectionChange(newSelection);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allSelected = selectedVolumes.length === volumes.length;
        const newSelection = allSelected ? [] : volumes.map(vol => vol.Name);
        onSelectionChange(newSelection);
    };

    const isAllSelected = selectedVolumes.length === volumes.length && volumes.length > 0;
    const isIndeterminate = selectedVolumes.length > 0 && selectedVolumes.length < volumes.length;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <TableContainer
            component={Paper}
            sx={{
                height: '100%',
                overflow: 'auto',
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
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,0,0,0.3) rgba(0,0,0,0.1)',
            }}
        >
            <Table stickyHeader sx={{ minWidth: 650 }}>
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                indeterminate={isIndeterminate}
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                            />
                        </TableCell>

                        <TableCell sx={{ fontWeight: 'bold' }}>
                            <TableSortLabel
                                active={sortField === 'name'}
                                direction={sortField === 'name' ? sortOrder : 'asc'}
                                onClick={() => handleSort('name')}
                            >
                                Volume Name
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>
                            <TableSortLabel
                                active={sortField === 'driver'}
                                direction={sortField === 'driver' ? sortOrder : 'asc'}
                                onClick={() => handleSort('driver')}
                            >
                                Driver
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>
                            <TableSortLabel
                                active={sortField === 'scope'}
                                direction={sortField === 'scope' ? sortOrder : 'asc'}
                                onClick={() => handleSort('scope')}
                            >
                                Scope
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                            <TableSortLabel
                                active={sortField === 'mountPoint'}
                                direction={sortField === 'mountPoint' ? sortOrder : 'asc'}
                                onClick={() => handleSort('mountPoint')}
                            >
                                Mount Point
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>
                            Labels
                        </TableCell>

                        <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>
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
                    {sortedVolumes.map((volume) => (
                        <TableRow
                            key={volume.Name}
                            hover
                            sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                cursor: 'pointer',
                                backgroundColor: selectedVolumes.includes(volume.Name)
                                    ? 'rgba(25, 118, 210, 0.08)'
                                    : 'transparent'
                            }}
                            onClick={() => handleRowSelection(volume.Name)}
                        >
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedVolumes.includes(volume.Name)}
                                    onChange={() => handleRowSelection(volume.Name)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </TableCell>

                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StorageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{
                                            wordBreak: 'break-all',
                                            fontWeight: 'medium'
                                        }}>
                                            {volume.Name}
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Copy Volume Name" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleCopyText(volume.Name, e)}
                                            sx={{
                                                opacity: 0.7,
                                                '&:hover': { opacity: 1 }
                                            }}
                                        >
                                            <CopyAll fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>

                            <TableCell>
                                <Chip
                                    label={volume.Driver}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </TableCell>

                            <TableCell>
                                <Chip
                                    label={volume.Scope}
                                    size="small"
                                    color={volume.Scope === 'local' ? 'success' : 'default'}
                                    variant="outlined"
                                />
                            </TableCell>

                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FolderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2" sx={{
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem'
                                    }}>
                                        {volume.MountPoint}
                                    </Typography>
                                    <Tooltip title="Copy Mount Point" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleCopyText(volume.MountPoint, e)}
                                            sx={{
                                                opacity: 0.7,
                                                '&:hover': { opacity: 1 }
                                            }}
                                        >
                                            <CopyAll fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>

                            <TableCell>
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                    {Object.keys(volume.Labels).length > 0 ? (
                                        <>
                                            {Object.entries(volume.Labels).slice(0, 2).map(([key, value]) => (
                                                <Tooltip key={key} title={`${key}: ${value}`} arrow>
                                                    <Chip
                                                        label={`${key}: ${value.length > 10 ? value.substring(0, 10) + '...' : value}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="secondary"
                                                        icon={<LabelIcon />}
                                                        sx={{ fontSize: '0.75rem' }}
                                                    />
                                                </Tooltip>
                                            ))}
                                            {Object.keys(volume.Labels).length > 2 && (
                                                <Chip
                                                    label={`+${Object.keys(volume.Labels).length - 2} more`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem' }}
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
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                        {formatDate(volume.CreatedAt)}
                                    </Typography>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};