import React, {useCallback, useState} from 'react';
import {
    Box,
    Checkbox,
    Chip,
    IconButton,
    Paper,
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
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import type {Volume} from "../../gen/docker/v1/docker_pb.ts";
import {formatBytes} from "../../lib/editor.ts";

type SortField = 'project' | 'size' | 'inuse' | 'name' | 'mountPoint' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface VolumeTableProps {
    volumes: Volume[];
    selectedVolumes?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const VolumeTable = ({volumes, selectedVolumes = [], onSelectionChange}: VolumeTableProps) => {
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

    const sortedVolumes = [...volumes].sort((a, b) => {
        let aValue: string | Date, bValue: string | Date;

        switch (sortField) {
            case "size": {
                const data = a.size > b.size ? 1 : -1;
                return sortOrder === 'asc' ? data : -data;
            }
            case "inuse": {
                const data = a.containerID > b.containerID ? 1 : -1;
                return sortOrder === 'asc' ? data : -data;
            }
            case "project":
                aValue = a.Labels;
                bValue = b.Labels;
                break;
            case 'name':
                aValue = a.Name;
                bValue = b.Name;
                break;
            case 'mountPoint':
                aValue = a.MountPoint;
                bValue = b.MountPoint;
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
                                Volume Name
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
                    {sortedVolumes.map((volume) => (
                        <TableRow
                            key={volume.Name}
                            hover
                            sx={{
                                '&:last-child td, &:last-child th': {border: 0},
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
                                {volume.Labels ? (
                                    <Chip
                                        label={`${volume.Labels}`}
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
                                            {volume.Name}
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Copy Volume Name" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleCopyText(volume.Name, e)}
                                            sx={{
                                                opacity: 0.7,
                                                '&:hover': {opacity: 1}
                                            }}
                                        >
                                            <CopyAll fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
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
                                            {formatBytes(volume.size)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </TableCell>

                            <TableCell>
                                {volume.containerID ? (
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
                                        {volume.MountPoint}
                                    </Typography>
                                    <Tooltip title="Copy Mount Point" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleCopyText(volume.MountPoint, e)}
                                            sx={{
                                                opacity: 0.7,
                                                '&:hover': {opacity: 1}
                                            }}
                                        >
                                            <CopyAll fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>


                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <CalendarIcon sx={{fontSize: 14, mr: 0.5, color: 'text.secondary'}}/>
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