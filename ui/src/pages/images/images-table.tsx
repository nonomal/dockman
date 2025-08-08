import React, {useCallback, useState} from 'react';
import {
    Box,
    Checkbox,
    Chip,
    IconButton,
    Link,
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
import {CalendarToday as CalendarIcon, CopyAll, Tag as TagIcon} from '@mui/icons-material';
import {getImageHomePageUrl, useDockerImages} from "../../hooks/docker-images.ts";
import {formatBytes} from "../../lib/editor.ts";


type SortField = 'name' | 'size' | 'sharedSize' | 'containers' | 'created';
type SortOrder = 'asc' | 'desc';

interface ImageTableProps {
    selectedImages?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export const ImageTable = ({selectedImages = [], onSelectionChange}: ImageTableProps) => {
    const [sortField, setSortField] = useState<SortField>('size');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const {images} = useDockerImages()

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Sort images based on current sort field and order
    const sortedImages = [...images].sort((a, b) => {
        let aValue: unknown, bValue: unknown;

        switch (sortField) {
            case 'name': {
                aValue = a.repoTags[0] || 'untagged';
                bValue = b.repoTags[0] || 'untagged';
                const comparison = (aValue as string).localeCompare(bValue as string);
                return sortOrder === 'asc' ? comparison : -comparison;
            }
            case 'size':
                aValue = a.size;
                bValue = b.size;
                break;
            case 'sharedSize':
                aValue = a.sharedSize;
                bValue = b.sharedSize;
                break;
            case 'containers':
                aValue = a.containers;
                bValue = b.containers;
                break;
            case 'created':
                aValue = a.created;
                bValue = b.created;
                break;
            default:
                return 0;
        }

        // Handle bigint sorting
        let result: number;

        if (typeof aValue === 'bigint' && typeof bValue === 'bigint') {
            // Convert bigint comparison to number
            if (aValue < bValue) result = -1;
            else if (aValue > bValue) result = 1;
            else result = 0;
        } else {
            // Handle regular number comparison
            const numA = Number(aValue);
            const numB = Number(bValue);
            result = numA - numB;
        }

        return sortOrder === 'asc' ? result : -result;
    });

    // Handle copy image ID
    const handleCopyId = useCallback(async (imageId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await navigator.clipboard.writeText(imageId);
            // You might want to show a toast notification here
            console.log('Image ID copied to clipboard');
        } catch (err) {
            console.error('Failed to copy image ID:', err);
        }
    }, []);

    // Handle individual row selection
    const handleRowSelection = (imageId: string) => {
        if (!onSelectionChange) return;

        const newSelection = selectedImages.includes(imageId)
            ? selectedImages.filter(id => id !== imageId)
            : [...selectedImages, imageId];

        onSelectionChange(newSelection);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allSelected = selectedImages.length === images.length;
        const newSelection = allSelected ? [] : images.map(img => img.id);
        onSelectionChange(newSelection);
    };

    const isAllSelected = selectedImages.length === images.length && images.length > 0;
    const isIndeterminate = selectedImages.length > 0 && selectedImages.length < images.length;

    return (
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
                                Images
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                            <TableSortLabel
                                active={sortField === 'containers'}
                                direction={sortField === 'containers' ? sortOrder : 'asc'}
                                onClick={() => handleSort('containers')}
                            >
                                Containers
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                            <TableSortLabel
                                active={sortField === 'size'}
                                direction={sortField === 'size' ? sortOrder : 'asc'}
                                onClick={() => handleSort('size')}
                            >
                                Size
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                            <TableSortLabel
                                active={sortField === 'sharedSize'}
                                direction={sortField === 'sharedSize' ? sortOrder : 'asc'}
                                onClick={() => handleSort('sharedSize')}
                            >
                                Shared Size
                            </TableSortLabel>
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 100}}>
                            Tags
                        </TableCell>

                        <TableCell sx={{fontWeight: 'bold', minWidth: 150}}>
                            <TableSortLabel
                                active={sortField === 'created'}
                                direction={sortField === 'created' ? sortOrder : 'asc'}
                                onClick={() => handleSort('created')}
                            >
                                Created
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedImages.map((image) => (
                        <TableRow
                            key={image.id}
                            hover
                            sx={{
                                '&:last-child td, &:last-child th': {border: 0},
                                cursor: 'pointer',
                                backgroundColor: selectedImages.includes(image.id)
                                    ? 'rgba(25, 118, 210, 0.08)'
                                    : 'transparent'
                            }}
                            onClick={() => handleRowSelection(image.id)}
                        >
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedImages.includes(image.id)}
                                    onChange={() => handleRowSelection(image.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </TableCell>

                            <TableCell>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <Box sx={{flex: 0.6}}>
                                        {image.repoTags.length > 0 ? (
                                            <Tooltip title="Open image website" arrow>
                                                <Link
                                                    href={getImageHomePageUrl(image.repoTags[0])}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{textDecoration: 'none', color: 'primary.main'}}
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <Typography variant="body2" component="span" sx={{
                                                        wordBreak: 'break-all',
                                                        '&:hover': {textDecoration: 'underline'}
                                                    }}>
                                                        {image.repoTags[0]}
                                                    </Typography>
                                                </Link>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                                                Untagged
                                            </Typography>
                                        )}
                                    </Box>
                                    <Tooltip title="Copy Image ID" arrow>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleCopyId(image.id, e)}
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
                                {Number(image.containers) > 0 ? (
                                    <Chip
                                        label={`${Number(image.containers)} using`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                ) : (
                                    <Chip
                                        label={`Unused ${Number(image.containers)}`}
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                    />)}
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
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

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
