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
import {
    CalendarToday as CalendarIcon,
    FolderOpen as FolderIcon,
    Label as LabelIcon,
    Storage as StorageIcon
} from '@mui/icons-material';
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import type {Volume} from "../../gen/docker/v1/docker_pb.ts";
import {formatBytes} from "../../lib/editor.ts";
import {useCopyButton} from "../../hooks/copy.ts";
import CopyButton from "../../components/copy-button.tsx";
import ComposeLink from "../../components/compose-link.tsx";

type SortField = 'project' | 'label' | 'size' | 'inuse' | 'name' | 'mountPoint' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface VolumeTableProps {
    volumes: Volume[];
    selectedVolumes?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const VolumeTable = ({volumes, selectedVolumes = [], onSelectionChange}: VolumeTableProps) => {
    const [sortField, setSortField] = useState<SortField>('label');
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
            case "project": {
                aValue = a.composeProjectName;
                bValue = b.composeProjectName;
                break;
            }
            case "label":
                aValue = a.labels;
                bValue = b.labels;
                break;
            case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
            case 'mountPoint':
                aValue = a.mountPoint;
                bValue = b.mountPoint;
                break;
            case 'createdAt':
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
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

    const {handleCopy, copiedId} = useCopyButton()

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
        const newSelection = allSelected ? [] : volumes.map(vol => vol.name);
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
                                active={sortField === 'label'}
                                direction={sortField === 'label' ? sortOrder : 'asc'}
                                onClick={() => handleSort('label')}
                            >
                                Label
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

                        <TableCell sx={{fontWeight: 'bold'}}>
                            <TableSortLabel
                                active={sortField === 'project'}
                                direction={sortField === 'project' ? sortOrder : 'asc'}
                                onClick={() => handleSort('project')}
                            >
                                Compose Project
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
                            key={volume.name}
                            hover
                            sx={{
                                '&:last-child td, &:last-child th': {border: 0},
                                cursor: 'pointer',
                                backgroundColor: selectedVolumes.includes(volume.name)
                                    ? 'rgba(25, 118, 210, 0.08)'
                                    : 'transparent'
                            }}
                            onClick={() => handleRowSelection(volume.name)}
                        >
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedVolumes.includes(volume.name)}
                                    onChange={() => handleRowSelection(volume.name)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </TableCell>

                            <TableCell>
                                {volume.labels ? (
                                    <Chip
                                        label={`${volume.labels}`}
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
                                            {volume.name}
                                        </Typography>
                                    </Box>
                                    <CopyButton
                                        handleCopy={handleCopy}
                                        thisID={volume.name}
                                        activeID={copiedId ?? ""}
                                        tooltip={"Copy Volume name"}
                                    />
                                </Box>
                            </TableCell>

                            <TableCell>
                                <ComposeLink
                                    servicePath={volume.composePath}
                                    stackName={volume.composeProjectName}
                                />
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
                                        {volume.mountPoint}
                                    </Typography>
                                    <CopyButton
                                        handleCopy={handleCopy}
                                        thisID={volume.mountPoint}
                                        activeID={copiedId ?? ""}
                                        tooltip={"Copy Mount point"}
                                    />
                                </Box>
                            </TableCell>


                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <CalendarIcon sx={{fontSize: 14, mr: 0.5, color: 'text.secondary'}}/>
                                    <Typography variant="body2">
                                        {formatDate(volume.createdAt)}
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