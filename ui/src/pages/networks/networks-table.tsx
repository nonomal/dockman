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
import {CalendarMonth, Label as LabelIcon} from '@mui/icons-material';
import scrollbarStyles from "../../components/scrollbar-style.tsx";
import type {Network} from "../../gen/docker/v1/docker_pb.ts";
import {useCopyButton} from "../../hooks/copy.ts";
import CopyButton from "../../components/copy-button.tsx";
import {formatDate} from "../../lib/api.ts";
import {capitalize, sortTable, type TableInfo, useSort} from "../../lib/table.ts";
import {TableLabelWithSort} from "../../lib/table-shared.tsx";

interface NetworkTableProps {
    networks: Network[];
    selectedNetworks?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const NetworkTable = ({networks, selectedNetworks = [], onSelectionChange}: NetworkTableProps) => {
    const {handleCopy, copiedId} = useCopyButton()

    const handleRowSelection = (volumeName: string) => {
        if (!onSelectionChange) return;

        const newSelection = selectedNetworks.includes(volumeName)
            ? selectedNetworks.filter(name => name !== volumeName)
            : [...selectedNetworks, volumeName];

        onSelectionChange(newSelection);
    };
    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allSelected = selectedNetworks.length === networks.length;
        const newSelection = allSelected ? [] : networks.map(vol => vol.id);
        onSelectionChange(newSelection);
    };
    const isAllSelected = selectedNetworks.length === networks.length && networks.length > 0;
    const isIndeterminate = selectedNetworks.length > 0 && selectedNetworks.length < networks.length;

    const {sortField, sortOrder, handleSort} = useSort("name", "desc")

    const tableInfo: TableInfo<Network> = {
        checkbox: {
            header: () => (
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={isIndeterminate}
                        checked={isAllSelected}
                        onChange={handleSelectAll}/>
                </TableCell>
            ),
            cell: (network: Network) => (
                <TableCell padding="checkbox">
                    <Checkbox
                        checked={selectedNetworks.includes(network.id)}
                        onChange={() => handleRowSelection(network.id)}
                        onClick={(e) => e.stopPropagation()}/>
                </TableCell>
            ),
            getValue: () => 0
        },
        name: {
            header: (label) => {
                const active = sortField === label;
                return (
                    <TableCell sx={{fontWeight: "bold"}}>
                        <TableSortLabel
                            active={active}
                            direction={active ? sortOrder : "asc"}
                            onClick={() => handleSort(label)}
                        >
                            {capitalize(label)}
                        </TableSortLabel>
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                        <Box sx={{flex: 1, display: "flex", alignItems: "center", gap: 1}}>
                            <Typography
                                variant="body2"
                                sx={{wordBreak: "break-all", fontWeight: "medium"}}
                            >
                                {network.name}
                            </Typography>
                            {(network.name === "host" || network.name === "bridge" || network.name === "none") && (
                                <Chip
                                    label="System"
                                    size="small"
                                    color="warning"
                                    variant="outlined"/>
                            )}
                        </Box>
                        <CopyButton
                            handleCopy={handleCopy}
                            thisID={network.id}
                            activeID={copiedId ?? ""}
                            tooltip="Copy Network ID"/>
                    </Box>
                </TableCell>
            ),
            getValue: (data) => data.name,
        },
        project: {
            getValue: data => data.composeProject,
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 100}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    {network.composeProject ? (
                        <Chip
                            label={network.name}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            icon={<LabelIcon/>}
                            sx={{fontSize: "0.75rem"}}
                        />
                    ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                </TableCell>
            )
        },
        inuse: {
            getValue: data => data.containerIds.length,
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 120}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Chip
                        label={`${network.containerIds.length} using`}
                        size="small"
                        variant="outlined"
                        color={network.containerIds.length === 0 ? "secondary" : "info"}
                        sx={{fontSize: "0.75rem"}}
                    />
                </TableCell>
            )
        },
        subnet: {
            getValue: data => data.subnet,
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 120}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Typography variant="body2" color="text.primary">
                        {network.subnet}
                    </Typography>
                </TableCell>
            )
        },
        scope: {
            getValue: data => data.scope,
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 120}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Typography variant="body2" color="text.primary">
                        {network.scope}
                    </Typography>
                </TableCell>
            )
        },
        driver: {
            getValue: data => data.driver,
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 200}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Typography variant="body2" color="text.primary">
                        {network.driver === "null" ? "-----" : network.driver}
                    </Typography>
                </TableCell>
            )
        },
        internal: {
            getValue: data => data.internal.toString(),
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 150}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Typography variant="body2" color="text.primary">
                        {network.internal.toString()}
                    </Typography>
                </TableCell>
            )
        },
        attachable: {
            getValue: data => data.attachable,
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 150}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Typography variant="body2" color="text.primary">
                        {network.attachable.toString()}
                    </Typography>
                </TableCell>
            )
        },
        "created": {
            getValue: data => data.createdAt,
            header: (label) => {
                return (
                    <TableCell sx={{fontWeight: "bold", minWidth: 150}}>
                        <TableLabelWithSort
                            label={label}
                            activeLabel={sortField}
                            sortOrder={sortOrder}
                            handleSort={handleSort}
                        />
                    </TableCell>
                );
            },
            cell: (network: Network) => (
                <TableCell>
                    <Box sx={{display: "flex", alignItems: "center"}}>
                        <CalendarMonth sx={{fontSize: 14, mr: 0.5, color: "text.secondary"}}/>
                        <Typography variant="body2">{formatDate(network.createdAt)}</Typography>
                    </Box>
                </TableCell>
            )
        }
    };

    const sortedNetworks = sortTable(networks, sortField, tableInfo, sortOrder);

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
                        {Object.entries(tableInfo).map(([key, val], index) => (
                            <React.Fragment key={index}>
                                {val.header(key)}
                            </React.Fragment>
                        ))}
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
                            {Object.values(tableInfo).map((val, index) => (
                                <React.Fragment key={index}>
                                    {val.cell(network)}
                                </React.Fragment>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};