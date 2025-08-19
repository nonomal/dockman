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
import {CalendarMonth, Label as LabelIcon} from '@mui/icons-material';
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import type {Network} from "../../gen/docker/v1/docker_pb.ts";
import {useCopyButton} from "../../hooks/copy.ts";
import CopyButton from "../../components/copy-button.tsx";
import {formatDate} from "../../lib/api.ts";

type SortField =
    'name'
    | 'project'
    | 'inuse'
    | 'subnet'
    | 'scope'
    | 'driver'
    | 'internal'
    | 'attachable'
    | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface NetworkTableProps {
    networks: Network[];
    selectedNetworks?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const NetworkTable = ({networks, selectedNetworks = [], onSelectionChange}: NetworkTableProps) => {
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedNetworks = [...networks].sort((a, b) => {
        let aValue: string | Date | number, bValue: string | Date | number;

        switch (sortField) {
            case "name":
                aValue = a.name
                bValue = b.name
                break;
            case "project":
                aValue = a.composeProject
                bValue = b.composeProject
                break;
            case "inuse":
                aValue = a.containerIds.length
                bValue = b.containerIds.length
                break;
            case "subnet":
                aValue = a.subnet
                bValue = b.subnet
                break;
            case "scope":
                aValue = a.scope
                bValue = b.scope
                break;
            case "driver":
                aValue = a.driver
                bValue = b.driver
                break;
            case "internal":
                // Fixed: should probably be a.internal, not a.name
                aValue = a.internal ? 1 : 0  // boolean to number conversion
                bValue = b.internal ? 1 : 0
                break;
            case "attachable":
                aValue = a.attachable ? 1 : 0  // Fixed: changed order (true = 1, false = 0)
                bValue = b.attachable ? 1 : 0
                break;
            case "createdAt":
                aValue = new Date(a.createdAt)
                bValue = new Date(b.createdAt)
                break;
            default:
                return 0;
        }

        let result: number;
        if (aValue instanceof Date && bValue instanceof Date) {
            result = aValue.getTime() - bValue.getTime();
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {  // Fixed: proper number type check
            result = aValue - bValue;
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

                        <TableCell sx={{fontWeight: 'bold'}}>
                            <TableSortLabel
                                active={sortField === 'name'}
                                direction={sortField === 'name' ? sortOrder : 'asc'}
                                onClick={() => handleSort('name')}
                            >
                                Network Name
                            </TableSortLabel>
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

                        <TableCell sx={{fontWeight: 'bold', minWidth: 120}}>
                            <TableSortLabel
                                active={sortField === 'inuse'}
                                direction={sortField === 'inuse' ? sortOrder : 'asc'}
                                onClick={() => handleSort('inuse')}
                            >
                                In Use
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 120}}>
                            <TableSortLabel
                                active={sortField === 'subnet'}
                                direction={sortField === 'subnet' ? sortOrder : 'asc'}
                                onClick={() => handleSort('subnet')}
                            >
                                Subnet
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 120}}>
                            <TableSortLabel
                                active={sortField === 'scope'}
                                direction={sortField === 'scope' ? sortOrder : 'asc'}
                                onClick={() => handleSort('scope')}
                            >
                                Scope
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 200}}>
                            <TableSortLabel
                                active={sortField === 'driver'}
                                direction={sortField === 'driver' ? sortOrder : 'asc'}
                                onClick={() => handleSort('driver')}
                            >
                                driver
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                            <TableSortLabel
                                active={sortField === 'internal'}
                                direction={sortField === 'internal' ? sortOrder : 'asc'}
                                onClick={() => handleSort('internal')}
                            >
                                Internal
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                            <TableSortLabel
                                active={sortField === 'attachable'}
                                direction={sortField === 'attachable' ? sortOrder : 'asc'}
                                onClick={() => handleSort('attachable')}
                            >
                                Attachable
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
                                        thisID={network.id}
                                        activeID={copiedId ?? ""}
                                        tooltip={"Copy Network name"}
                                    />
                                </Box>
                            </TableCell>

                            <TableCell>
                                {network.composeProject ? (
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
                                <Chip
                                    label={`${network.containerIds.length} using`}
                                    size="small"
                                    variant="outlined"
                                    color={network.containerIds.length === 0 ? "secondary" : "info"}
                                    // icon={<SensorOccupied/>}
                                    sx={{fontSize: '0.75rem'}}
                                />
                            </TableCell>

                            <TableCell>
                                <Typography variant="body2" color="text.primary">
                                    {network.subnet}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography variant="body2" color="text.primary">
                                    {network.scope}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography variant="body2" color="text.primary">
                                    {network.driver === "null" ? "-----" : network.driver}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography variant="body2" color="text.primary">
                                    {network.internal.toString()}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography variant="body2" color="text.primary">
                                    {network.attachable.toString()}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <CalendarMonth sx={{fontSize: 14, mr: 0.5, color: 'text.secondary'}}/>
                                    <Typography variant="body2">
                                        {formatDate(network.createdAt)}
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