import React from 'react';
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
import {type SortOrder, sortTable, type TableInfo, useSort} from "../../lib/table.ts";
import {formatDate} from "../../lib/api.ts";
import {useConfig} from "../../hooks/config.ts";

interface VolumeTableProps {
    volumes: Volume[];
    selectedVolumes?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const VolumeTable = ({
                                volumes,
                                selectedVolumes = [],
                                onSelectionChange
                            }: VolumeTableProps) => {
    const {handleCopy, copiedId} = useCopyButton();

    const handleRowSelection = (volumeName: string) => {
        if (!onSelectionChange) return;

        const newSelection = selectedVolumes.includes(volumeName)
            ? selectedVolumes.filter(name => name !== volumeName)
            : [...selectedVolumes, volumeName];

        onSelectionChange(newSelection);
    };

    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allSelected = selectedVolumes.length === volumes.length;
        const newSelection = allSelected ? [] : volumes.map(vol => vol.name);
        onSelectionChange(newSelection);
    };

    const isAllSelected = selectedVolumes.length === volumes.length && volumes.length > 0;
    const isIndeterminate = selectedVolumes.length > 0 && selectedVolumes.length < volumes.length;

    const {dockYaml} = useConfig()
    const {
        sortField,
        sortOrder,
        handleSort,
    } = useSort(
        dockYaml?.volumesPage?.sort?.sortField ?? 'name',
        (dockYaml?.volumesPage?.sort?.sortOrder as SortOrder) ?? 'asc'
    )

    const tableInfo: TableInfo<Volume> = {
        checkbox: {
            getValue: () => 0,
            header: () => (
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={isIndeterminate}
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                    />
                </TableCell>
            ),
            cell: (volume) => (
                <TableCell padding="checkbox">
                    <Checkbox
                        checked={selectedVolumes.includes(volume.name)}
                        onChange={() => handleRowSelection(volume.name)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </TableCell>
            )
        },
        "Volume Name": {
            getValue: (volume) => volume.name,
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: 'bold'}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : 'asc'}
                            onClick={() => handleSort(label)}
                        >
                            {label}
                        </TableSortLabel>
                    </TableCell>
                )
            },
            cell: (volume) => (
                <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Box sx={{flex: 1}}>
                            <Typography variant="body2" sx={{wordBreak: 'break-all', fontWeight: 'medium'}}>
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
            )
        },
        Label: {
            getValue: (volume) => volume.labels || '',
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: 'bold'}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : 'asc'}
                            onClick={() => handleSort(label)}
                        >
                            {label}
                        </TableSortLabel>
                    </TableCell>
                )
            },
            cell: (volume) => (
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
                        <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                </TableCell>
            )
        },
        Project: {
            getValue: (volume) => volume.composeProjectName || '',
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: 'bold'}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : 'asc'}
                            onClick={() => handleSort(label)}
                        >
                            {label}
                        </TableSortLabel>
                    </TableCell>
                )
            },
            cell: (volume) => (
                <TableCell>
                    <ComposeLink
                        servicePath={volume.composePath}
                        stackName={volume.composeProjectName}
                    />
                </TableCell>
            )
        },
        Size: {
            getValue: (volume) => volume.size,
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: 'bold', minWidth: 120}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : 'asc'}
                            onClick={() => handleSort(label)}
                        >
                            {label}
                        </TableSortLabel>
                    </TableCell>
                )
            },
            cell: (volume) => (
                <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <StorageIcon sx={{fontSize: 18, color: 'text.secondary'}}/>
                        <Box sx={{flex: 1}}>
                            <Typography variant="body2" sx={{wordBreak: 'break-all', fontWeight: 'medium'}}>
                                {formatBytes(volume.size)}
                            </Typography>
                        </Box>
                    </Box>
                </TableCell>
            )
        },
        "In use": {
            getValue: (volume) => !!volume.containerID,
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: 'bold', minWidth: 120}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : 'asc'}
                            onClick={() => handleSort(label)}
                        >
                            {label}
                        </TableSortLabel>
                    </TableCell>
                )
            },
            cell: (volume) => (
                <TableCell>
                    <Chip
                        label={volume.containerID ? 'in use' : 'unused'}
                        size="small"
                        color={volume.containerID ? 'success' : 'info'}
                        variant="outlined"
                    />
                </TableCell>
            )
        },
        "Mount Point": {
            getValue: (volume) => volume.mountPoint,
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: 'bold', minWidth: 200}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : 'asc'}
                            onClick={() => handleSort(label)}
                        >
                            {label}
                        </TableSortLabel>
                    </TableCell>
                )
            },
            cell: (volume) => (
                <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <FolderIcon sx={{fontSize: 16, color: 'text.secondary'}}/>
                        <Typography variant="body2"
                                    sx={{wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.85rem'}}>
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
            )
        },
        Created: {
            getValue: (volume) => volume.createdAt,
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : 'asc'}
                            onClick={() => handleSort(label)}
                        >
                            {label}
                        </TableSortLabel>
                    </TableCell>
                )
            },
            cell: (volume) => (
                <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <CalendarIcon sx={{fontSize: 14, mr: 0.5, color: 'text.secondary'}}/>
                        <Typography variant="body2">
                            {formatDate(volume.createdAt)}
                        </Typography>
                    </Box>
                </TableCell>
            )
        }
    };

    const sortedVolumes = sortTable(volumes, sortField, tableInfo, sortOrder);

    return (
        <TableContainer
            component={Paper}
            sx={{height: '100%', overflow: 'auto', ...scrollbarStyles}}
        >
            <Table stickyHeader sx={{minWidth: 650}}>
                <TableHead>
                    <TableRow>
                        {Object.entries(tableInfo).map(([key, val], index) => (
                            <React.Fragment key={index}>
                                {val.header(key)}
                            </React.Fragment>
                        ))}
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
                            {Object.values(tableInfo).map((val, index) => (
                                <React.Fragment key={index}>
                                    {val.cell(volume)}
                                </React.Fragment>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};